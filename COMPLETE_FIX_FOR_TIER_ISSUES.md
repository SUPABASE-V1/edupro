# Complete Fix for Tier Display Issues

## Problem Summary

**Symptom**: Principal dashboard shows "Free" tier, but database shows "Starter" plan

**Root Causes**:
1. ❌ Migration not applied yet → RPC functions don't exist
2. ❌ TierBadge falls back to `preschools.subscription_plan` column (outdated)
3. ❌ `preschools.subscription_plan` column out of sync with `subscriptions` table

**The subscriptions table is the SOURCE OF TRUTH**

## Solution: 3-Step Fix

### Step 1: Apply the Migration (REQUIRED)

```bash
# Apply the migration to create RPC functions
supabase db push

# OR via Supabase Dashboard SQL Editor:
# Copy and run: /workspace/supabase/migrations/20251031000000_implement_user_trial_subscriptions.sql
```

**This creates**:
- ✅ `start_parent_trial()` - Creates user-level trials for parents
- ✅ `get_my_trial_status()` - Gets correct tier from subscriptions table

### Step 2: Sync the Preschools Table (RECOMMENDED)

Run this SQL to sync the old column with the new data:

```sql
-- Sync preschools.subscription_plan with subscriptions table
UPDATE preschools p
SET subscription_plan = sp.tier,
    updated_at = NOW()
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.school_id = p.id
  AND s.owner_type = 'school'
  AND s.status IN ('active', 'trialing')
  AND (p.subscription_plan IS NULL OR p.subscription_plan != sp.tier);

-- Verify Young Eagles is now synced
SELECT 
  p.name,
  p.subscription_plan as old_column,
  sp.tier as actual_tier,
  CASE 
    WHEN p.subscription_plan = sp.tier THEN '✅ SYNCED'
    ELSE '❌ STILL OUT OF SYNC'
  END as status
FROM preschools p
JOIN subscriptions s ON s.school_id = p.id AND s.owner_type = 'school'
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE p.id = 'ba79097c-1b93-4b48-bcbe-df73878ab4d1';
-- Expected: Shows "✅ SYNCED" and tier = "starter"
```

### Step 3: Deploy Updated Frontend (DONE)

The TierBadge component has been updated to:
1. ✅ **First**: Try `get_my_trial_status()` RPC (most accurate)
2. ✅ **Fallback**: Read directly from `subscriptions` table (source of truth)
3. ✅ **Last resort**: Read from `preschools.subscription_plan` column (legacy)

**File updated**: `/workspace/web/src/components/ui/TierBadge.tsx`

## After Applying Fixes

### For Young Eagles Specifically:

```sql
-- Check what tier Young Eagles should see now
SELECT 
  p.name as school_name,
  sp.tier as correct_tier,
  sp.name as plan_name,
  s.status as subscription_status,
  s.start_date,
  s.next_billing_date
FROM preschools p
JOIN subscriptions s ON s.school_id = p.id AND s.owner_type = 'school'
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE p.id = 'ba79097c-1b93-4b48-bcbe-df73878ab4d1';
```

**Expected Result**:
```
school_name  | correct_tier | plan_name    | subscription_status
-------------|--------------|--------------|--------------------
Young Eagles | starter      | Starter Plan | active
```

### Test as Principal:

1. Login as Young Eagles principal
2. Go to dashboard
3. Open browser console (F12)
4. Run: `localStorage.clear()` (clear cache)
5. Refresh page
6. ✅ Should see "Starter" badge (not "Free")

### Verify RPC Works:

```sql
-- Test get_my_trial_status as principal
-- (Run this while logged in as Young Eagles principal)
SELECT get_my_trial_status();

-- Expected JSON response:
{
  "status": "active",
  "plan_tier": "starter",
  "plan_name": "Starter Plan",
  "subscription_type": "school",
  "owner_type": "school",
  ...
}
```

## Why This Happened

### Historical Context:

**Old System** (Before subscriptions table):
```
preschools table
├── subscription_plan column (e.g., "free", "starter", "premium")
└── This was the single source of truth
```

**New System** (After subscriptions table):
```
subscriptions table (SOURCE OF TRUTH)
├── Detailed subscription data
├── Trial periods
├── Payment info
├── Status tracking
└── Links to subscription_plans table

preschools table
├── subscription_plan column (DEPRECATED/LEGACY)
└── Should be synced with subscriptions table but often isn't
```

**The Problem**:
- Code was still reading from old `preschools.subscription_plan` column
- That column wasn't being updated when subscriptions changed
- Result: Dashboard showed old/wrong data

**The Solution**:
- Always read from `subscriptions` table (via RPC or direct query)
- Sync `preschools.subscription_plan` as backup
- Update TierBadge to use correct source

## Migration Status Check

Run this to verify migration was applied:

```sql
-- Check if RPC functions exist
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('start_parent_trial', 'get_my_trial_status')
ORDER BY routine_name;

-- Expected: 2 rows
-- start_parent_trial | FUNCTION | json
-- get_my_trial_status | FUNCTION | json
```

If no rows returned → **Migration not applied yet!**

## Complete Verification Script

```sql
-- ============================================================
-- COMPLETE VERIFICATION FOR YOUNG EAGLES
-- ============================================================

-- 1. Check subscriptions table (SOURCE OF TRUTH)
SELECT 
  'SUBSCRIPTIONS TABLE' as check_name,
  sp.tier as tier,
  s.status,
  'This is what the system SHOULD show' as note
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE s.school_id = 'ba79097c-1b93-4b48-bcbe-df73878ab4d1'
  AND s.owner_type = 'school';

-- 2. Check preschools table (LEGACY COLUMN)
SELECT 
  'PRESCHOOLS TABLE' as check_name,
  subscription_plan as tier,
  'This might be out of sync' as note
FROM preschools
WHERE id = 'ba79097c-1b93-4b48-bcbe-df73878ab4d1';

-- 3. Compare them
SELECT 
  CASE 
    WHEN p.subscription_plan = sp.tier THEN '✅ IN SYNC'
    ELSE '❌ OUT OF SYNC - RUN fix_tier_sync.sql'
  END as sync_status,
  p.subscription_plan as preschools_column,
  sp.tier as subscriptions_table,
  CASE 
    WHEN p.subscription_plan != sp.tier 
    THEN 'Run: UPDATE preschools SET subscription_plan = ''' || sp.tier || ''' WHERE id = ''' || p.id || ''';'
    ELSE 'No action needed'
  END as fix_command
FROM preschools p
JOIN subscriptions s ON s.school_id = p.id AND s.owner_type = 'school'
JOIN subscription_plans sp ON s.plan_id = sp.id
WHERE p.id = 'ba79097c-1b93-4b48-bcbe-df73878ab4d1';

-- 4. Check if RPC functions exist
SELECT 
  COUNT(*) as rpc_count,
  CASE 
    WHEN COUNT(*) = 2 THEN '✅ Migration applied'
    ELSE '❌ Migration NOT applied - Run supabase db push'
  END as migration_status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('start_parent_trial', 'get_my_trial_status');
```

## Summary Checklist

- [ ] **Step 1**: Apply migration (`supabase db push`)
- [ ] **Step 2**: Sync preschools table (run `fix_tier_sync.sql`)
- [ ] **Step 3**: Deploy updated frontend
- [ ] **Step 4**: Clear browser cache and test
- [ ] **Step 5**: Verify principal sees correct tier

## Expected Timeline

- **Immediate**: After Step 1, RPC functions work
- **Immediate**: After Step 2, legacy column synced
- **Next deployment**: After Step 3, frontend uses correct source
- **Full fix**: After all 3 steps + cache clear

---

**Files to use**:
- `/workspace/supabase/migrations/20251031000000_implement_user_trial_subscriptions.sql`
- `/workspace/fix_tier_sync.sql`
- `/workspace/diagnose_tier_mismatch.sql`
- `/workspace/COMPLETE_FIX_FOR_TIER_ISSUES.md` (this file)
