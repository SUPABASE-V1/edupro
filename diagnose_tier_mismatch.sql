-- Diagnose tier mismatch for Young Eagles Preschool

-- 1. Check what the preschools table says
SELECT 
  p.id as preschool_id,
  p.name as preschool_name,
  p.subscription_plan as preschool_tier_column,
  'preschools.subscription_plan column (OLD)' as source
FROM preschools p
WHERE p.id = 'ba79097c-1b93-4b48-bcbe-df73878ab4d1';

-- 2. Check what the subscriptions table says
SELECT 
  s.id as subscription_id,
  s.school_id,
  sp.tier as actual_tier,
  sp.name as plan_name,
  s.status,
  'subscriptions table (CORRECT)' as source
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.school_id = 'ba79097c-1b93-4b48-bcbe-df73878ab4d1'
AND s.owner_type = 'school';

-- 3. Check what get_my_trial_status returns for principal
-- (You need to run this as the principal user)
-- SELECT get_my_trial_status();

-- 4. Find the plan_id details
SELECT 
  id,
  tier,
  name,
  is_active
FROM subscription_plans
WHERE id = 'a45c5296-1f01-41a3-b5d6-0e4c8c9fafb8';
