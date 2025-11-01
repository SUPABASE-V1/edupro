# Check User Trial Status - davecon12martin@outlook.com

## 🔍 How to Check Trial Status

### **Step 1: Run These Queries in Supabase SQL Editor**

Copy and paste each query into Supabase Dashboard → SQL Editor:

```sql
-- 1️⃣ Find the user
SELECT 
  id as user_id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'davecon12martin@outlook.com';
```

```sql
-- 2️⃣ Check user profile (role, organization, usage_type)
SELECT 
  id,
  role,
  preschool_id,
  usage_type,
  first_name,
  last_name,
  created_at
FROM profiles
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'davecon12martin@outlook.com'
);
```

```sql
-- 3️⃣ Check organization subscription (if linked)
SELECT 
  p.id as org_id,
  p.name as org_name,
  p.subscription_plan,
  p.subscription_tier,
  p.subscription_end_date,
  p.is_active,
  p.created_at
FROM preschools p
WHERE p.id = (
  SELECT preschool_id FROM profiles 
  WHERE id = (
    SELECT id FROM auth.users WHERE email = 'davecon12martin@outlook.com'
  )
);
```

```sql
-- 4️⃣ Check if subscriptions table exists and has trial data
SELECT 
  s.id,
  s.preschool_id,
  s.plan_tier,
  s.is_trial,
  s.trial_end_date,
  CASE 
    WHEN s.trial_end_date > NOW() THEN EXTRACT(DAY FROM s.trial_end_date - NOW())
    ELSE 0
  END as days_remaining,
  s.created_at
FROM subscriptions s
WHERE s.preschool_id = (
  SELECT preschool_id FROM profiles 
  WHERE id = (
    SELECT id FROM auth.users WHERE email = 'davecon12martin@outlook.com'
  )
);
```

---

## 🎯 What You Should See

### **For a FREE TRIAL User:**

#### **Query 1 (auth.users):**
```
user_id: abc-123-xyz
email: davecon12martin@outlook.com
created_at: 2025-11-01
email_confirmed_at: 2025-11-01 (should have value)
```

#### **Query 2 (profiles):**
```
id: abc-123-xyz
role: parent
preschool_id: (UUID or NULL - depending on if linked)
usage_type: 'homeschool' | 'k12_school' | 'preschool' | etc.
```

#### **Query 3 (preschools) - IF linked to organization:**
```
org_id: xyz-789-abc
org_name: "Some School Name"
subscription_tier: 'starter' | 'premium' | 'free'
subscription_end_date: (date in future if on trial)
```

#### **Query 4 (subscriptions) - IF trial system is active:**
```
is_trial: true
trial_end_date: 2025-11-15 (14 days from signup)
days_remaining: 14
plan_tier: 'premium' or 'starter'
```

---

## ❓ What if NO Trial Data Shows?

If Query 4 returns **no rows**, it means:
- ❌ The trial migration hasn't been run
- ❌ OR the user doesn't have an organization
- ❌ OR the subscriptions table doesn't exist

---

## 🚀 How to SET UP a Free Trial

### **Option 1: If User Has Organization (School/Preschool)**

```sql
-- Set organization to free trial (14 days, Premium tier)
INSERT INTO subscriptions (
  preschool_id,
  plan_tier,
  is_trial,
  trial_end_date,
  created_at,
  updated_at
)
SELECT 
  preschool_id,
  'premium' as plan_tier,
  true as is_trial,
  NOW() + INTERVAL '14 days' as trial_end_date,
  NOW(),
  NOW()
FROM profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'davecon12martin@outlook.com')
ON CONFLICT (preschool_id) 
DO UPDATE SET
  is_trial = true,
  trial_end_date = NOW() + INTERVAL '14 days',
  plan_tier = 'premium',
  updated_at = NOW();
```

### **Option 2: If User is Independent (No Organization)**

For independent parents (homeschool, supplemental, etc.), trials are typically:
- ✅ All features available immediately
- ✅ No trial needed (free tier is generous)
- ✅ OR trial tracked at user level (not org level)

```sql
-- Check if user has usage_type set
SELECT usage_type FROM profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'davecon12martin@outlook.com');

-- Expected: 'homeschool', 'supplemental', 'exploring', 'independent', etc.
```

---

## 🎨 What the Dashboard SHOULD Show

### **For Users WITH Trial:**

```
┌────────────────────────────────────────────────────┐
│ ✨ 14 Days Left in Your Premium Trial             │
│ Enjoying your trial? Upgrade anytime to unlock    │
│ all features                          [Upgrade]   │
└────────────────────────────────────────────────────┘
```
- Green background (8+ days left)
- Orange background (4-7 days left)
- Red background (1-3 days left)

### **For Users WITHOUT Trial:**

```
┌────────────────────────────────────────────────────┐
│ 👋 Good Morning, Dave                              │
│ [NO trial banner - normal dashboard]              │
└────────────────────────────────────────────────────┘
```
- No trial banner
- Normal dashboard experience
- All free features available

---

## 🔧 Troubleshooting

### **Problem: "subscriptions table doesn't exist"**

**Solution:** Run the trial migration:
```sql
-- Check if migration was applied
SELECT * FROM migration_logs 
WHERE name LIKE '%trial%' 
ORDER BY applied_at DESC;
```

If no results, run:
```bash
# In Supabase Dashboard → SQL Editor
# Paste contents of: 
# supabase/migrations/20251026223350_implement_14_day_free_trial.sql
```

### **Problem: "User has no preschool_id"**

This is NORMAL for:
- ✅ Homeschool parents
- ✅ Supplemental learning users
- ✅ Exploring users
- ✅ Independent parents

**These users don't need organization-level trials.**

They get:
- ✅ Full access to CAPS curriculum
- ✅ AI tutor features
- ✅ Progress tracking
- ✅ All parent features

### **Problem: "Trial banner not showing"**

Reasons:
1. ❌ `get_my_trial_status()` RPC doesn't exist
2. ❌ User has no trial data in database
3. ❌ User is not linked to an organization
4. ❌ RPC permissions not granted

**Solution:**
```sql
-- Check if RPC exists
SELECT * FROM pg_proc 
WHERE proname = 'get_my_trial_status';
```

If not found, the RPC was never created. Run migration:
`supabase/migrations/20251026223350_implement_14_day_free_trial.sql`

---

## 📊 Expected Behavior by User Type

### **🏫 Organization-Linked Parents:**
- ✅ Should see trial banner (if organization has trial)
- ✅ Trial is at ORGANIZATION level (all users share)
- ✅ 14 days from organization creation

### **🏠 Independent Parents (Homeschool, etc.):**
- ✅ NO trial banner (not needed)
- ✅ Full free tier access
- ✅ Can upgrade to paid tier anytime
- ✅ Trial at user level (optional)

---

## ✅ Quick Check Commands

```sql
-- Does user exist?
SELECT email FROM auth.users WHERE email = 'davecon12martin@outlook.com';

-- What's their role?
SELECT role, usage_type FROM profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'davecon12martin@outlook.com');

-- Do they have an organization?
SELECT preschool_id FROM profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'davecon12martin@outlook.com');

-- Does organization have trial?
SELECT is_trial, trial_end_date FROM subscriptions
WHERE preschool_id = (
  SELECT preschool_id FROM profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'davecon12martin@outlook.com')
);
```

---

## 🎯 Summary

**To answer your question:**

1. **Check the SQL queries above** to see the user's current state
2. **If they have an organization** → They should have trial data in `subscriptions`
3. **If they're independent** → No trial needed, they use free tier
4. **Trial banner only shows** if `is_trial = true` and `trial_end_date > NOW()`

**Run Query 1-4 and share the results, I'll tell you if it's correct!** 📊
