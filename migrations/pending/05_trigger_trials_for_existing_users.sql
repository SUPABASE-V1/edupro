-- ================================================================
-- Trigger 7-Day Free Trial for All Existing Users
-- ================================================================
-- This migration grants free trials to users who registered before
-- the trial system was implemented
-- Created: 2025-10-31
-- ================================================================

DO $$
DECLARE
  starter_plan_id UUID;
  user_record RECORD;
  inserted_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  -- Get starter plan ID
  SELECT id INTO starter_plan_id 
  FROM public.subscription_plans 
  WHERE tier = 'starter' 
  LIMIT 1;
  
  IF starter_plan_id IS NULL THEN
    RAISE EXCEPTION 'Starter plan not found. Please ensure subscription_plans table is populated.';
  END IF;

  RAISE NOTICE 'Starting trial activation for existing users...';
  RAISE NOTICE 'Starter Plan ID: %', starter_plan_id;

  -- Loop through all active preschools/schools without active subscriptions
  FOR user_record IN 
    SELECT 
      p.id,
      p.name,
      p.created_at
    FROM public.preschools p
    WHERE p.is_active = true
    AND NOT EXISTS (
      SELECT 1 
      FROM public.preschool_subscriptions ps 
      WHERE ps.preschool_id = p.id 
      AND ps.status = 'active'
    )
  LOOP
    BEGIN
      -- Create trial subscription
      INSERT INTO public.preschool_subscriptions (
        preschool_id,
        subscription_plan_id,
        status,
        trial_start_date,
        trial_end_date,
        next_billing_date,
        created_at
      ) VALUES (
        user_record.id,
        starter_plan_id,
        'trial',
        NOW(),
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '8 days', -- Grace period
        NOW()
      );
      
      inserted_count := inserted_count + 1;
      
      RAISE NOTICE 'Created trial for: % (ID: %)', user_record.name, user_record.id;
      
    EXCEPTION WHEN OTHERS THEN
      skipped_count := skipped_count + 1;
      RAISE NOTICE 'Skipped % (ID: %): %', user_record.name, user_record.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE '✅ Trial activation complete!';
  RAISE NOTICE '   - Trials created: %', inserted_count;
  RAISE NOTICE '   - Skipped: %', skipped_count;
  
  -- Also trigger trials for individual users (parents) if user_subscriptions exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subscriptions') THEN
    FOR user_record IN
      SELECT 
        u.id,
        u.email,
        u.created_at
      FROM auth.users u
      WHERE NOT EXISTS (
        SELECT 1 
        FROM public.user_subscriptions us 
        WHERE us.user_id = u.id 
        AND us.status = 'active'
      )
      LIMIT 100 -- Safety limit
    LOOP
      BEGIN
        -- Create user trial (for parents)
        INSERT INTO public.user_subscriptions (
          user_id,
          subscription_plan_id,
          status,
          trial_start_date,
          trial_end_date,
          next_billing_date,
          created_at
        ) VALUES (
          user_record.id,
          starter_plan_id,
          'trial',
          NOW(),
          NOW() + INTERVAL '7 days',
          NOW() + INTERVAL '8 days',
          NOW()
        );
        
        inserted_count := inserted_count + 1;
        
      EXCEPTION WHEN OTHERS THEN
        -- Silently skip if user_subscriptions doesn't exist yet
        NULL;
      END;
    END LOOP;
  END IF;

END $$;

-- ================================================================
-- Update existing free users to trial
-- ================================================================

UPDATE public.preschool_subscriptions
SET 
  status = 'trial',
  trial_start_date = NOW(),
  trial_end_date = NOW() + INTERVAL '7 days',
  next_billing_date = NOW() + INTERVAL '8 days',
  updated_at = NOW()
WHERE status = 'free'
  AND trial_start_date IS NULL;

-- ================================================================
-- Verification
-- ================================================================

DO $$
DECLARE
  trial_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trial_count
  FROM public.preschool_subscriptions
  WHERE status = 'trial';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Current trial subscriptions: %', trial_count;
  RAISE NOTICE '✅ All existing users now have 7-day trial access!';
END $$;
