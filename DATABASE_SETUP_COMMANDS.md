# Database Setup - What to Run Right Now

**Quick answer:** Copy and paste these SQL commands into your Supabase SQL Editor.

---

## 🚀 Step 1: Run the Main Migration (REQUIRED)

Open **Supabase Dashboard** → **SQL Editor** → **New Query**

Then paste the entire file:
```
migrations/20251101_add_usage_type_and_fix_currency.sql
```

Or find it here: `/workspace/migrations/20251101_add_usage_type_and_fix_currency.sql`

**What it does:**
- ✅ Adds `usage_type` for parent categories
- ✅ Makes school linking optional
- ✅ Sets all currency to **ZAR (South African Rand)** 🇿🇦
- ✅ Adds approval system for schools
- ✅ Creates helper functions

---

## 🏫 Step 2: Approve Your Schools (REQUIRED)

After the migration, run this to make schools visible in signup:

```sql
-- Approve ALL existing schools
UPDATE preschools 
SET 
  approved = TRUE, 
  verified = TRUE 
WHERE is_active = TRUE;
```

Or approve specific schools only:

```sql
-- See all schools first
SELECT id, name, type, city, approved, verified 
FROM preschools 
ORDER BY name;

-- Then approve specific ones
UPDATE preschools 
SET approved = TRUE, verified = TRUE
WHERE id IN (
  'school-id-1',
  'school-id-2'
);
```

---

## ✅ Step 3: Verify It Worked

Run these queries to check:

```sql
-- 1. Check usage types exist
SELECT usage_type, COUNT(*) 
FROM profiles 
WHERE role = 'parent' 
GROUP BY usage_type;

-- 2. Check currency is ZAR
SELECT DISTINCT currency FROM fees;
SELECT DISTINCT currency FROM payments;

-- 3. Check approved schools
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN approved THEN 1 ELSE 0 END) as approved
FROM preschools;
```

**Expected results:**
- Usage types showing (preschool, independent, etc.)
- Currency showing as `ZAR`
- Some approved schools (at least 1)

---

## 💰 Step 4: Set ZAR Pricing (OPTIONAL)

If you have subscription plans, ensure they're in Rand:

```sql
-- Check current plans
SELECT name, price, currency FROM subscription_plans;

-- Update to ZAR with SA pricing
UPDATE subscription_plans 
SET 
  price = CASE 
    WHEN name = 'Free' THEN 0
    WHEN name = 'Premium' THEN 99.99    -- R99.99/month
    WHEN name = 'Family' THEN 199.99    -- R199.99/month
    ELSE price
  END,
  currency = 'ZAR';
```

---

## 🧪 Step 5: Test the Flow

1. Go to your app: `/sign-up/parent`
2. Try signing up as:
   - ✅ **Homeschool** (should work without selecting school)
   - ✅ **Preschool** (should show schools as optional)
   - ✅ **Supplemental** (should work without selecting school)

---

## 🆘 Quick Troubleshooting

**Problem: No schools showing in signup**
```sql
UPDATE preschools SET approved = TRUE, verified = TRUE;
```

**Problem: Currency not ZAR**
```sql
UPDATE fees SET currency = 'ZAR';
UPDATE payments SET currency = 'ZAR';
UPDATE subscription_plans SET currency = 'ZAR';
```

**Problem: usage_type is NULL**
```sql
UPDATE profiles 
SET usage_type = 'independent' 
WHERE usage_type IS NULL AND role = 'parent';
```

---

## 📋 What Tables Are Modified

| Table | Changes |
|-------|---------|
| `profiles` | + `usage_type` column |
| `preschools` | + `approved`, `verified` columns |
| `students` | + `date_of_birth`, `grade_level`, nullable `preschool_id` |
| `fees` | + `currency` column (default ZAR) |
| `payments` | + `currency` column (default ZAR) |
| `subscription_plans` | + `currency` column (default ZAR) |

---

## ✅ That's It!

After running these commands, your database is ready for the new flexible parent signup flow.

**Total Time:** 5 minutes  
**Risk:** Low (adds columns, no data loss)

---

## 📚 Need More Details?

- **Full instructions:** See `migrations/MIGRATION_INSTRUCTIONS.md`
- **Quick start:** See `migrations/QUICK_START.md`
- **What changed:** See `PARENT_SIGNUP_FLOW_AUDIT.md`
- **Features:** See `FEATURE_DIFFERENTIATION_GUIDE.md`

---

**Questions?** The migration file has extensive comments explaining each step.
