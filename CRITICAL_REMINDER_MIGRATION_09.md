# 🚨 CRITICAL: Run Migration 09 FIRST!

## ⚠️ ERROR: column "parent_id" does not exist

You're seeing this error because **Migration 09 hasn't been run yet**.

---

## 🔴 The Problem

Many files in the system expect `students` table to have:
- `parent_id` column
- `guardian_id` column

But your database still has the **old schema** with `parent_ids UUID[]` (array).

---

## ✅ The Solution

**Run migrations in this EXACT order**:

### Step 1: Run Migration 09 (FIRST!)
**File**: `migrations/pending/09_fix_students_parent_columns.sql`

**Via Supabase Dashboard**:
1. Go to Supabase Dashboard → SQL Editor
2. Copy **ALL** contents of `migrations/pending/09_fix_students_parent_columns.sql`
3. Paste into SQL Editor
4. Click "Run"
5. ✅ Should see: "Students table parent columns verified!"

**What it does**:
- Adds `parent_id UUID` column (if missing)
- Adds `guardian_id UUID` column (if missing)
- Migrates data from `parent_ids` array
- Creates indexes
- **This fixes the "parent_id does not exist" error!**

---

### Step 2: Run Migration 07 (SECOND)
**File**: `migrations/pending/07_school_fee_management_system.sql`

Same process:
1. Copy all contents
2. Paste in SQL Editor
3. Run
4. ✅ Should see: "School Fee Management System installed successfully!"

---

### Step 3: Run Migration 08 (THIRD - Optional)
**File**: `migrations/pending/08_invoice_management_system.sql`

Same process:
1. Copy all contents
2. Paste in SQL Editor  
3. Run
4. ✅ Should see: "Invoice Management System installed successfully!"

---

## 🎯 Why This Order?

```
Migration 09 (students table fix)
    ↓
    Adds parent_id & guardian_id columns
    ↓
Migration 07 (fee management)
    ↓
    Uses parent_id in RLS policies
    ↓
Migration 08 (invoice system)
    ↓
    Also uses parent_id in RLS policies
```

**If you skip 09**: Migrations 07 and 08 will fail with "column parent_id does not exist"

---

## 🔍 How to Verify Migration 09 Worked

After running migration 09, run this in SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('parent_id', 'guardian_id');
```

**Expected result**: Should return 2 rows:
- `parent_id` | `uuid`
- `guardian_id` | `uuid`

If you see these, migration 09 succeeded! ✅

---

## 📋 Quick Checklist

- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy `09_fix_students_parent_columns.sql`
- [ ] Paste and Run
- [ ] Verify success message
- [ ] Copy `07_school_fee_management_system.sql`
- [ ] Paste and Run
- [ ] Verify success message
- [ ] (Optional) Copy `08_invoice_management_system.sql`
- [ ] (Optional) Paste and Run
- [ ] (Optional) Verify success message

---

## 🚀 After Migrations

Once all 3 migrations complete:

1. **Refresh your app** (Ctrl+Shift+R)
2. **Test parent fees page** (`/dashboard/parent/payments`)
3. **Test principal fees page** (`/dashboard/principal/fees`)
4. **No more "parent_id" errors!** ✅

---

## 📞 If Migration 09 Fails

**Error: "column already exists"**
→ Good! It means migration 09 already ran. Proceed to migration 07.

**Error: "table students does not exist"**
→ Major schema issue. Check your database has a `students` table.

**Error: "permission denied"**
→ Make sure you're running as database owner or have ALTER TABLE permissions.

**Other errors?**
→ Share the exact error message and I'll help!

---

## 💡 TL;DR

**You MUST run migration 09 first!**

```
09 → 07 → 08
(Required) → (Required) → (Optional)
```

**Status**: Migration 09 not run yet (hence the error)  
**Action**: Run migration 09 via Supabase Dashboard NOW! 🚨

---

**See also**:
- `COMPLETE_MIGRATION_GUIDE.md` - Full instructions
- `MIGRATION_ORDER_FIX.md` - Why order matters
- `MIGRATION_08_ERROR_GUIDE.md` - Troubleshooting
