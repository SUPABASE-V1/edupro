-- Fix tier synchronization issues
-- This updates the preschools.subscription_plan column to match the subscriptions table

-- Step 1: Update preschools table to match subscriptions table
UPDATE preschools p
SET subscription_plan = sp.tier
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.school_id = p.id
AND s.owner_type = 'school'
AND s.status IN ('active', 'trialing')
AND (p.subscription_plan IS NULL OR p.subscription_plan != sp.tier);

-- Check the result for Young Eagles specifically
SELECT 
  p.id,
  p.name,
  p.subscription_plan as old_column,
  sp.tier as actual_tier,
  s.status,
  CASE 
    WHEN p.subscription_plan = sp.tier THEN '✅ SYNCED'
    ELSE '❌ OUT OF SYNC'
  END as sync_status
FROM preschools p
LEFT JOIN subscriptions s ON s.school_id = p.id AND s.owner_type = 'school'
LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE p.id = 'ba79097c-1b93-4b48-bcbe-df73878ab4d1';
