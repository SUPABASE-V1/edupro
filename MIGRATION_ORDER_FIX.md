# 🔧 Migration Order - CRITICAL FIX

## ⚠️ Error You're Seeing

```
ERROR: 42703: column "parent_id" does not exist
```

**Why**: The `students` table might not have `parent_id` and `guardian_id` columns yet.

---

## ✅ Solution: Run Migrations in Correct Order

### Step 1: Fix Students Table FIRST

```bash
psql $DB_URL -f migrations/pending/09_fix_students_parent_columns.sql
```

This migration:
- ✅ Adds `parent_id` column if missing
- ✅ Adds `guardian_id` column if missing
- ✅ Creates indexes
- ✅ Migrates data from `parent_ids` array (if it exists)
- ✅ Safe to run multiple times (idempotent)

---

### Step 2: Run Fee Management

```bash
psql $DB_URL -f migrations/pending/07_school_fee_management_system.sql
```

---

### Step 3: Run Invoice System

```bash
psql $DB_URL -f migrations/pending/08_invoice_management_system.sql
```

---

## 🚀 All-in-One Command

Run all 3 migrations in order:

```bash
psql $DB_URL -f migrations/pending/09_fix_students_parent_columns.sql && \
psql $DB_URL -f migrations/pending/07_school_fee_management_system.sql && \
psql $DB_URL -f migrations/pending/08_invoice_management_system.sql
```

---

## ✅ Verification

After running, check columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('parent_id', 'guardian_id');
```

Should return:
```
 column_name  | data_type
--------------+-----------
 parent_id    | uuid
 guardian_id  | uuid
```

---

## 🎯 What Each Migration Does

### Migration 09: Fix Students Parent Columns
- **Purpose**: Ensure students table has parent relationship columns
- **Time**: <1 second
- **Safe**: Yes (checks before adding)

### Migration 07: Fee Management
- **Purpose**: Fee structures, assignments, payments
- **Time**: 5-10 seconds
- **Depends on**: Migration 09

### Migration 08: Invoice System
- **Purpose**: Professional invoicing
- **Time**: 5-10 seconds
- **Depends on**: Migration 07, 09

---

## 🔍 Alternative: Check Your Schema

If you want to see what's in your students table:

```sql
-- Check all columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Check if parent_id exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'students' AND column_name = 'parent_id'
);
```

---

## 💡 Why This Happened

Your `students` table might have been created with an older schema that used:
- `parent_ids UUID[]` (array) instead of `parent_id UUID`
- Or didn't have parent relationship columns at all

The new system needs individual `parent_id` and `guardian_id` columns for proper relationships.

---

## ✅ After Migration

Once done, these will work:
- Fee assignment to students ✅
- Invoice generation with parent details ✅
- Parent viewing their children's fees ✅
- PayFast payment flow ✅

---

**Run migration 09 first, then everything will work!** 🚀
