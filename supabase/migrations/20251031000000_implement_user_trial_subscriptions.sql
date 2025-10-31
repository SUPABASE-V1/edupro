-- =====================================================================
-- User-Specific Trial Subscription Implementation
-- =====================================================================
-- This migration implements per-user trial subscriptions for parents
-- so that new parents get their own 7-day trial independent of the
-- school's subscription status.
--
-- Features:
-- - start_parent_trial() RPC to create user-level trial subscriptions
-- - Updated get_my_trial_status() to check user subscriptions first
-- - Idempotent design - safe to call multiple times
-- =====================================================================

-- =====================================================================
-- PART 1: Add user_id column to subscriptions if it doesn't exist
-- =====================================================================

-- The column should already exist from migration 20250920191909_add_owner_type_column_only.sql
-- but we ensure it here for safety
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.subscriptions 
        ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
        
        CREATE INDEX idx_subscriptions_user_id ON public.subscriptions (user_id);
        
        RAISE NOTICE 'Added user_id column to subscriptions table';
    ELSE
        RAISE NOTICE 'user_id column already exists in subscriptions table';
    END IF;
END $$;

-- Make school_id nullable since user subscriptions don't have a school_id
DO $$
BEGIN
    -- Check if school_id is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions' 
        AND column_name = 'school_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.subscriptions 
        ALTER COLUMN school_id DROP NOT NULL;
        
        RAISE NOTICE 'Made school_id nullable in subscriptions table';
    END IF;
END $$;

-- Add constraint to ensure either school_id or user_id is set (but not both)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscriptions_owner_check'
    ) THEN
        ALTER TABLE public.subscriptions 
        ADD CONSTRAINT subscriptions_owner_check 
        CHECK (
            (owner_type = 'school' AND school_id IS NOT NULL AND user_id IS NULL) OR
            (owner_type = 'user' AND user_id IS NOT NULL AND school_id IS NULL)
        );
        
        RAISE NOTICE 'Added owner check constraint to subscriptions table';
    END IF;
END $$;

-- =====================================================================
-- PART 2: Create start_parent_trial() RPC Function
-- =====================================================================

CREATE OR REPLACE FUNCTION start_parent_trial()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
  v_existing_subscription subscriptions%ROWTYPE;
  v_starter_plan_id uuid;
  v_free_plan_id uuid;
  v_new_subscription_id uuid;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Get user's role
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = v_user_id;
  
  -- Allow both 'parent' role and NULL role (for new signups that haven't set role yet)
  -- This ensures parents can get trials even if they skip school selection
  IF v_user_role IS NOT NULL AND v_user_role != 'parent' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User trials are only available for parents',
      'role', v_user_role
    );
  END IF;
  
  -- Check if user already has a subscription
  SELECT * INTO v_existing_subscription
  FROM subscriptions
  WHERE owner_type = 'user' 
  AND user_id = v_user_id
  LIMIT 1;
  
  -- If subscription exists, return its status
  IF FOUND THEN
    RETURN json_build_object(
      'success', true,
      'already_exists', true,
      'subscription_id', v_existing_subscription.id,
      'status', v_existing_subscription.status,
      'trial_end_date', v_existing_subscription.trial_end_date,
      'message', 'User subscription already exists'
    );
  END IF;
  
  -- Get starter plan ID (default trial plan)
  SELECT id INTO v_starter_plan_id
  FROM subscription_plans
  WHERE tier = 'starter'
  AND is_active = true
  LIMIT 1;
  
  -- Get free plan ID (fallback)
  SELECT id INTO v_free_plan_id
  FROM subscription_plans
  WHERE tier = 'free'
  AND is_active = true
  LIMIT 1;
  
  IF v_starter_plan_id IS NULL AND v_free_plan_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No subscription plans available'
    );
  END IF;
  
  -- Create new user-level trial subscription
  INSERT INTO subscriptions (
    owner_type,
    user_id,
    school_id,
    plan_id,
    status,
    start_date,
    trial_end_date,
    next_billing_date,
    seats_total,
    seats_used,
    billing_frequency
  ) VALUES (
    'user',
    v_user_id,
    NULL, -- No school_id for user subscriptions
    COALESCE(v_starter_plan_id, v_free_plan_id),
    'trialing',
    NOW(),
    NOW() + INTERVAL '7 days', -- 7-day trial for parents
    NOW() + INTERVAL '8 days', -- Billing would start after trial
    1, -- One seat for the parent
    1, -- Seat is used by the parent
    'monthly'
  )
  RETURNING id INTO v_new_subscription_id;
  
  RAISE NOTICE 'Created 7-day trial subscription for user %', v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'subscription_id', v_new_subscription_id,
    'status', 'trialing',
    'trial_end_date', NOW() + INTERVAL '7 days',
    'days_remaining', 7,
    'message', '7-day trial started successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- =====================================================================
-- PART 3: Update get_my_trial_status() to Check User Subscriptions First
-- =====================================================================

CREATE OR REPLACE FUNCTION get_my_trial_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_preschool_id uuid;
  v_user_role text;
  result json;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'is_trial', false,
      'status', 'free',
      'plan_tier', 'free',
      'message', 'Not authenticated'
    );
  END IF;
  
  -- Get user's preschool ID and role
  SELECT preschool_id, role INTO v_user_preschool_id, v_user_role
  FROM profiles
  WHERE id = v_user_id;
  
  -- PRIORITY 1: Check for user-level subscription (for parents)
  -- This ALWAYS takes precedence over school subscriptions
  -- This is critical for parents to get their own trials independent of school status
  SELECT json_build_object(
    'is_trial', s.status = 'trialing',
    'status', s.status,
    'trial_end_date', s.trial_end_date,
    'days_remaining', COALESCE(trial_days_remaining(s.id), 0),
    'plan_tier', sp.tier,
    'plan_name', sp.name,
    'subscription_type', 'user',
    'owner_type', s.owner_type
  ) INTO result
  FROM subscriptions s
  INNER JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.owner_type = 'user' 
  AND s.user_id = v_user_id
  ORDER BY s.created_at DESC
  LIMIT 1;
  
  -- If user has their own subscription, ALWAYS return it (don't check school)
  -- This ensures parent trials work even if they're in a school with free tier
  IF result IS NOT NULL THEN
    RETURN result;
  END IF;
  
  -- PRIORITY 2: For non-parents (teachers, principals), check school subscription
  -- Parents without user subscriptions also fall back to school subscription
  IF v_user_preschool_id IS NOT NULL THEN
    SELECT json_build_object(
      'is_trial', s.status = 'trialing',
      'status', s.status,
      'trial_end_date', s.trial_end_date,
      'days_remaining', COALESCE(trial_days_remaining(s.id), 0),
      'plan_tier', sp.tier,
      'plan_name', sp.name,
      'subscription_type', 'school',
      'owner_type', s.owner_type
    ) INTO result
    FROM subscriptions s
    INNER JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.owner_type = 'school' 
    AND s.school_id = v_user_preschool_id
    ORDER BY s.created_at DESC
    LIMIT 1;
    
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
  END IF;
  
  -- No subscription found - return free tier status
  -- This is normal for users without any subscription
  RETURN json_build_object(
    'is_trial', false,
    'status', 'free',
    'plan_tier', 'free',
    'message', 'No active subscription',
    'subscription_type', 'none'
  );
END;
$$;

-- =====================================================================
-- PART 4: Grant Permissions
-- =====================================================================

-- Allow authenticated users to call start_parent_trial
GRANT EXECUTE ON FUNCTION start_parent_trial() TO authenticated;

-- get_my_trial_status already has permissions from the previous migration
GRANT EXECUTE ON FUNCTION get_my_trial_status() TO authenticated;

-- =====================================================================
-- PART 5: Comments and Documentation
-- =====================================================================

COMMENT ON FUNCTION start_parent_trial() IS 
  'Creates a 7-day trial subscription for the authenticated parent user. Idempotent - returns existing subscription if already created. Only works for users with parent role.';

COMMENT ON FUNCTION get_my_trial_status() IS 
  'Returns the current user''s trial status. Checks user-level subscription first (for parents), then falls back to school subscription. Safe for client-side RPC calls.';

COMMENT ON COLUMN subscriptions.owner_type IS 
  'Type of subscription owner: "school" for school-wide subscriptions, "user" for individual user subscriptions (e.g., parent trials)';

COMMENT ON COLUMN subscriptions.user_id IS 
  'User ID for user-owned subscriptions. NULL for school subscriptions.';

COMMENT ON COLUMN subscriptions.school_id IS 
  'School ID for school-owned subscriptions. NULL for user subscriptions.';
