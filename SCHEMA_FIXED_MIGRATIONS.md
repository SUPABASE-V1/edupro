# ✅ Schema Fixed - Migrations Updated

## 🔧 What Was Wrong

**Error**: Used wrong table names
```sql
-- ❌ Wrong (what I used)
preschool_subscriptions
organization_subscriptions

-- ✅ Correct (actual schema)
subscriptions
```

## ✅ What Was Fixed

### Corrected Table Names:
- `preschool_subscriptions` → `subscriptions`
- `preschool_id` → `school_id` (foreign key column)
- `subscription_plan_id` → `plan_id`

### Corrected Status Values:
- `'trial'` → `'trialing'` (matches existing schema)
- `'active'` stays `'active'`

### Fixed Column Names:
- `trial_start_date` → uses `start_date` 
- Kept `trial_end_date` (already exists)

## 📝 Updated Files

Both migration files have been corrected:

1. ✅ `migrations/pending/05_trigger_trials_for_existing_users.sql`
2. ✅ `migrations/pending/06_standardize_trial_period.sql`

## 🎯 Correct Schema Reference

```sql
-- Subscriptions table structure
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY,
  school_id uuid REFERENCES preschools(id),  ← Links to preschools
  plan_id uuid REFERENCES subscription_plans(id),
  status text DEFAULT 'active',  ← 'trialing', 'active', 'free', etc.
  start_date timestamptz DEFAULT now(),
  trial_end_date timestamptz,  ← NULL if not in trial
  next_billing_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## ✅ Ready to Apply

Now you can run the migrations:

```bash
# Via script
./migrations/APPLY_TRIAL_FIXES.sh

# Or manually via Supabase Dashboard SQL Editor
```

The migrations will now:
1. ✅ Query correct tables (`subscriptions`, `preschools`)
2. ✅ Use correct columns (`school_id`, `plan_id`)
3. ✅ Use correct status (`'trialing'` not `'trial'`)
4. ✅ Work with your actual schema

## 🧪 Test Query

After migration, verify with:

```sql
-- Check trials created
SELECT 
  p.name as school_name,
  s.status,
  s.trial_end_date,
  EXTRACT(DAY FROM (s.trial_end_date - NOW())) as days_remaining
FROM subscriptions s
JOIN preschools p ON s.school_id = p.id
WHERE s.status = 'trialing'
ORDER BY s.trial_end_date;
```

## 🎉 All Fixed!

The migrations are now aligned with your actual database schema and ready to run.
