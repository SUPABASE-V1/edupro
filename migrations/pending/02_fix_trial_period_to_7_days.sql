-- Fix Trial Period to 7 Days
-- Updates the trial creation function to use 7 days instead of 14

-- Update the trial creation function
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  starter_plan_id uuid;
  free_plan_id uuid;
BEGIN
  -- Get starter plan ID (default trial plan)
  SELECT id INTO starter_plan_id
  FROM subscription_plans
  WHERE tier = 'starter'
  LIMIT 1;
  
  -- Get free plan ID (fallback)
  SELECT id INTO free_plan_id
  FROM subscription_plans
  WHERE tier = 'free'
  LIMIT 1;
  
  -- Create trial subscription if no subscription exists
  IF NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE school_id = NEW.id
  ) THEN
    INSERT INTO subscriptions (
      school_id,
      plan_id,
      status,
      start_date,
      trial_end_date,
      next_billing_date,
      seats_allocated,
      seats_used
    ) VALUES (
      NEW.id,
      COALESCE(starter_plan_id, free_plan_id),
      'trialing',
      NOW(),
      NOW() + INTERVAL '7 days', -- 7-day trial
      NOW() + INTERVAL '8 days', -- Billing starts after trial
      10,
      0
    );
    
    RAISE NOTICE 'Created 7-day trial subscription for school %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION create_trial_subscription() IS 
  'Creates a 7-day trial subscription for new schools automatically';
