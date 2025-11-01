-- Update get_my_trial_status to prioritize user-level subscriptions
-- Ensures parents receive trials independent of their linked organization

CREATE OR REPLACE FUNCTION get_my_trial_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id uuid := auth.uid();
  user_subscription RECORD;
  school_subscription RECORD;
  user_preschool_id uuid;
BEGIN
  IF auth_user_id IS NULL THEN
    RETURN json_build_object(
      'is_trial', false,
      'message', 'Not authenticated'
    );
  END IF;

  -- Prefer personal subscriptions (owner_type='user')
  SELECT s.id,
         s.status,
         s.trial_end_date,
         sp.tier,
         sp.name,
         s.owner_type
  INTO user_subscription
  FROM subscriptions s
  INNER JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.owner_type = 'user'
    AND s.user_id = auth_user_id
  ORDER BY COALESCE(s.updated_at, s.created_at) DESC NULLS LAST
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'is_trial', user_subscription.status = 'trialing',
      'trial_end_date', user_subscription.trial_end_date,
      'days_remaining', trial_days_remaining(user_subscription.id),
      'plan_tier', user_subscription.tier,
      'plan_name', user_subscription.name,
      'owner_type', 'user'
    );
  END IF;

  -- Fallback: derive school subscription from profile
  SELECT preschool_id INTO user_preschool_id
  FROM profiles
  WHERE id = auth_user_id;

  IF user_preschool_id IS NULL THEN
    RETURN json_build_object(
      'is_trial', false,
      'message', 'No school associated with account'
    );
  END IF;

  SELECT s.id,
         s.status,
         s.trial_end_date,
         sp.tier,
         sp.name,
         s.owner_type
  INTO school_subscription
  FROM subscriptions s
  INNER JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE (s.owner_type IS NULL OR s.owner_type <> 'user')
    AND s.school_id = user_preschool_id
  ORDER BY COALESCE(s.updated_at, s.created_at) DESC NULLS LAST
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'is_trial', school_subscription.status = 'trialing',
      'trial_end_date', school_subscription.trial_end_date,
      'days_remaining', trial_days_remaining(school_subscription.id),
      'plan_tier', school_subscription.tier,
      'plan_name', school_subscription.name,
      'owner_type', COALESCE(school_subscription.owner_type::text, 'school')
    );
  END IF;

  RETURN json_build_object(
    'is_trial', false,
    'message', 'No subscription found'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_trial_status() TO authenticated;
