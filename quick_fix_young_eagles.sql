-- QUICK FIX: Sync Young Eagles tier immediately
-- Run this in Supabase SQL Editor to fix the tier display issue RIGHT NOW

-- Step 1: Update Young Eagles preschools record to match subscriptions table
UPDATE preschools p
SET 
  subscription_plan = sp.tier,
  updated_at = NOW()
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE p.id = 'ba79097c-1b93-4b48-bcbe-df73878ab4d1'
  AND s.school_id = p.id
  AND s.owner_type = 'school'
  AND s.status = 'active';

-- Step 2: Verify it worked
SELECT 
  p.name as school_name,
  p.subscription_plan as preschools_column,
  sp.tier as subscriptions_table,
  CASE 
    WHEN p.subscription_plan = sp.tier THEN '✅ FIXED!'
    ELSE '❌ Still broken'
  END as status
FROM preschools p
JOIN subscriptions s ON s.school_id = p.id AND s.owner_type = 'school'
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE p.id = 'ba79097c-1b93-4b48-bcbe-df73878ab4d1';

-- Expected output:
-- school_name  | preschools_column | subscriptions_table | status
-- -------------|-------------------|---------------------|----------
-- Young Eagles | starter           | starter             | ✅ FIXED!

-- ============================================================
-- BONUS: Fix ALL schools that are out of sync
-- ============================================================
-- Uncomment and run this to fix all schools at once:

/*
UPDATE preschools p
SET 
  subscription_plan = sp.tier,
  updated_at = NOW()
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.school_id = p.id
  AND s.owner_type = 'school'
  AND s.status IN ('active', 'trialing')
  AND (p.subscription_plan IS NULL OR p.subscription_plan != sp.tier);

-- Show which schools were updated
SELECT 
  p.name,
  p.subscription_plan,
  'Updated' as action
FROM preschools p
WHERE p.updated_at > NOW() - INTERVAL '1 minute'
ORDER BY p.updated_at DESC;
*/
