# 🔧 Function Overload Error - Explained & Fixed

## ❌ The Error

```
ERROR: 42725: function name "public.create_trial_subscription" is not unique
HINT: Specify the argument list to select the function unambiguously.
```

---

## 📖 What This Means

### The Problem:
PostgreSQL has **multiple functions** with the same name but **different parameters** (called function overloading).

```sql
-- Function 1 (from old migration)
CREATE FUNCTION create_trial_subscription()
RETURNS TRIGGER ...

-- Function 2 (our new migration trying to create)
CREATE FUNCTION create_trial_subscription(p_school_id UUID)
RETURNS UUID ...
```

When you try to `CREATE OR REPLACE FUNCTION` without specifying which one, PostgreSQL doesn't know which to replace!

---

## 🔍 Why This Happened

### Original Function (Trigger-based)
From `20251026223350_implement_14_day_free_trial.sql`:
```sql
-- This runs automatically on INSERT into preschools table
CREATE OR REPLACE FUNCTION create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-create trial for NEW school
  INSERT INTO subscriptions (school_id, ...)
  VALUES (NEW.id, ...);
  RETURN NEW;
END;
$$;
```

### New Function (RPC-callable)
From our migration:
```sql
-- This can be called manually: SELECT create_trial_subscription('school-id')
CREATE OR REPLACE FUNCTION create_trial_subscription(p_school_id UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create trial for specific school
  INSERT INTO subscriptions (school_id, ...)
  VALUES (p_school_id, ...);
  RETURN subscription_id;
END;
$$;
```

Both have the **same name** but **different signatures**!

---

## ✅ The Fix

### Option 1: Drop First, Then Create (Recommended)

```sql
-- Drop ALL versions of the function
DROP FUNCTION IF EXISTS public.create_trial_subscription();
DROP FUNCTION IF EXISTS public.create_trial_subscription(UUID);

-- Now create with full signature
CREATE OR REPLACE FUNCTION public.create_trial_subscription(p_school_id UUID)
RETURNS UUID
LANGUAGE plpgsql
...
```

### Option 2: Use Different Name

```sql
-- Rename the new function to avoid conflict
CREATE OR REPLACE FUNCTION public.create_manual_trial_subscription(p_school_id UUID)
RETURNS UUID
...
```

### Option 3: Specify Full Signature

```sql
-- Explicitly state which function to replace
CREATE OR REPLACE FUNCTION public.create_trial_subscription(p_school_id UUID)
RETURNS UUID
...
-- PostgreSQL will know this is different from create_trial_subscription()
```

---

## 🎯 What We'll Do

We'll use **Option 1** - Drop both versions cleanly, then recreate:

```sql
-- Clean slate approach
DROP FUNCTION IF EXISTS public.create_trial_subscription() CASCADE;
DROP FUNCTION IF EXISTS public.create_trial_subscription(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.create_trial_subscription(p_school_id UUID) CASCADE;

-- Now create fresh with clear signature
CREATE FUNCTION public.create_trial_subscription(p_school_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- ... implementation
END;
$$;
```

The `CASCADE` will also drop any triggers that depend on it, which we'll recreate.

---

## 📋 Function Signatures in PostgreSQL

### How PostgreSQL Identifies Functions

```sql
-- These are DIFFERENT functions (overloading):
CREATE FUNCTION my_func() RETURNS TEXT;                    -- Signature: my_func()
CREATE FUNCTION my_func(name TEXT) RETURNS TEXT;           -- Signature: my_func(TEXT)
CREATE FUNCTION my_func(id INT, name TEXT) RETURNS TEXT;   -- Signature: my_func(INT, TEXT)

-- To drop a specific one:
DROP FUNCTION my_func();              -- Drops the no-args version
DROP FUNCTION my_func(TEXT);          -- Drops the one-TEXT-arg version
DROP FUNCTION my_func(INT, TEXT);     -- Drops the two-arg version
```

### Common Mistake

```sql
-- ❌ This fails if multiple versions exist
DROP FUNCTION my_func;

-- ✅ Always specify the signature
DROP FUNCTION my_func();
DROP FUNCTION my_func(TEXT);
```

---

## 🔧 The Fix Applied to Our Migration

I'll update the migration to:
1. Drop all existing versions
2. Create clean new version
3. Handle trigger separately if needed

---

## 📚 Learning Points

1. **Function Overloading**: PostgreSQL allows multiple functions with same name but different parameters
2. **Ambiguity Error**: When modifying, you must specify which version
3. **Best Practice**: Always drop with full signature before CREATE OR REPLACE
4. **CASCADE**: Use it to also drop dependent objects (triggers, views, etc.)

---

## ✅ Next Steps

I'm updating the migration file now to include proper DROP statements.
