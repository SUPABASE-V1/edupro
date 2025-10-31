# ✅ Migration Fixes Applied

## All Issues Fixed

### 1. ✅ Table Name Issue
**Error**: `relation "public.preschool_subscriptions" does not exist`

**Fix**:
```sql
-- ❌ Before
FROM public.preschool_subscriptions

-- ✅ After
FROM public.subscriptions
```

---

### 2. ✅ Column Name Issue
**Error**: Column mismatch

**Fix**:
```sql
-- ❌ Before
preschool_id, subscription_plan_id

-- ✅ After
school_id, plan_id
```

---

### 3. ✅ Status Enum Issue
**Error**: `invalid input value for enum subscription_status: "free"`

**Fix**:
```sql
-- ❌ Before
WHERE status = 'free'  -- 'free' is not a valid status!

-- ✅ After
WHERE plan_id IN (SELECT id FROM subscription_plans WHERE tier = 'free')
-- 'free' is a TIER, not a STATUS
```

**Valid Values**:
- **Status**: `'active'`, `'trialing'`, `'past_due'`, `'canceled'`, `'unpaid'`
- **Tier**: `'free'`, `'starter'`, `'premium'`, `'enterprise'`

---

### 4. ✅ ROW_COUNT Issue
**Error**: `column "row_count" does not exist`

**Fix**:
```sql
-- ❌ Before
RAISE NOTICE 'Updated % rows', ROW_COUNT;

-- ✅ After
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE ...;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % rows', updated_count;
END;
```

---

## ✅ All Migrations Ready

### Files Fixed:
1. ✅ `migrations/pending/05_trigger_trials_for_existing_users.sql`
2. ✅ `migrations/pending/06_standardize_trial_period.sql`

### What They Do:

#### Migration 05 - Trigger Trials
- Creates 7-day trials for all existing schools without subscriptions
- Updates free tier users to trial status
- Handles both school and parent subscriptions
- Uses correct table/column names
- Properly handles enum values

#### Migration 06 - Standardize Configuration
- Creates `system_config` table for trial settings
- Adds helper functions (get_trial_duration_days, etc.)
- Standardizes trial period to 7 days
- Makes duration configurable

---

## 🚀 How to Apply

### Option 1: Shell Script
```bash
cd /workspace
./migrations/APPLY_TRIAL_FIXES.sh
```

### Option 2: Supabase Dashboard
1. Go to SQL Editor
2. Copy contents of `05_trigger_trials_for_existing_users.sql`
3. Run it
4. Copy contents of `06_standardize_trial_period.sql`
5. Run it

### Option 3: psql
```bash
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f migrations/pending/05_trigger_trials_for_existing_users.sql

psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f migrations/pending/06_standardize_trial_period.sql
```

---

## 🧪 Verification

After running migrations:

```sql
-- 1. Check trial count
SELECT COUNT(*) as trial_users
FROM subscriptions
WHERE status = 'trialing';

-- 2. Check trial configuration
SELECT * FROM system_config WHERE key = 'trial_settings';

-- 3. View trial details
SELECT 
  p.name as school_name,
  s.status,
  s.trial_end_date,
  EXTRACT(DAY FROM (s.trial_end_date - NOW())) as days_remaining
FROM subscriptions s
JOIN preschools p ON s.school_id = p.id
WHERE s.status = 'trialing'
ORDER BY s.trial_end_date;

-- 4. Test helper functions
SELECT get_trial_duration_days(); -- Should return 7
SELECT is_trial_active('SCHOOL_ID'::uuid);
SELECT get_trial_days_remaining('SCHOOL_ID'::uuid);
```

---

## 📊 Expected Results

### After Migration 05:
- All existing schools without active subscriptions get trials
- Schools on free tier are upgraded to trial
- Status: `'trialing'`
- Trial end date: NOW() + 7 days
- Next billing: NOW() + 8 days

### After Migration 06:
- `system_config` table created
- Trial duration: 7 days (configurable)
- Helper functions available
- Single source of truth for trial settings

---

## 🎯 What Users Will See

### New Users:
- ✅ Automatic 7-day trial on signup
- ✅ Full starter plan features
- ✅ Trial countdown in UI
- ✅ Upgrade prompts before expiry

### Existing Users:
- ✅ 7-day trial activated immediately
- ✅ Access to premium features
- ✅ Can upgrade anytime
- ✅ Auto-downgrade after trial if no payment

---

## 🔧 Configuration

To change trial duration later:

```sql
-- Update to 14 days
UPDATE system_config 
SET value = jsonb_set(value, '{duration_days}', '14')
WHERE key = 'trial_settings';

-- Update grace period
UPDATE system_config 
SET value = jsonb_set(value, '{grace_period_days}', '2')
WHERE key = 'trial_settings';

-- Verify
SELECT value FROM system_config WHERE key = 'trial_settings';
```

---

## ✅ All Issues Resolved!

| Issue | Status | Fix Applied |
|-------|--------|-------------|
| Wrong table names | ✅ Fixed | subscriptions, preschools |
| Wrong column names | ✅ Fixed | school_id, plan_id |
| Invalid enum 'free' | ✅ Fixed | Use tier instead of status |
| ROW_COUNT error | ✅ Fixed | GET DIAGNOSTICS |

**Ready to run migrations!** 🚀

No more errors expected.
