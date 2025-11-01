-- Run these queries to verify the migration was applied successfully

-- 1. Check if RPC functions exist
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname IN ('start_parent_trial', 'get_my_trial_status')
ORDER BY proname;
-- Expected: 2 rows (both functions should exist)

-- 2. Check subscriptions table has required columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND column_name IN ('owner_type', 'user_id', 'school_id')
ORDER BY column_name;
-- Expected: 3 rows (all columns should exist)

-- 3. Check if constraint exists
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'subscriptions_owner_check';
-- Expected: 1 row (constraint should exist)

-- 4. Check if indexes exist
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE tablename = 'subscriptions'
AND indexname IN ('idx_subscriptions_owner_type', 'idx_subscriptions_user_id');
-- Expected: 2 rows (both indexes should exist)

-- 5. Test the functions work (must be run as authenticated user)
-- This will fail if not authenticated, but verifies function is callable
SELECT start_parent_trial();
-- If authenticated as parent: should create trial or return existing
-- If not authenticated: will return error message in JSON

SELECT get_my_trial_status();
-- Should return current trial status as JSON
