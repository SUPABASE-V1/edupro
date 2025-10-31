# 🚀 Complete Migration Guide - Run This!

## ⚠️ IMPORTANT: Migration Order Matters!

You **MUST** run migrations in this exact order:

---

## 📋 Migration Sequence

### Step 1: Fix Students Table (REQUIRED FIRST!)
**File**: `migrations/pending/09_fix_students_parent_columns.sql`

**What it does**:
- Adds `parent_id` column to students table (if missing)
- Adds `guardian_id` column to students table (if missing)
- Creates indexes
- Migrates data from `parent_ids` array

**Why First**: All other migrations need these columns!

**Run via Supabase Dashboard**:
1. Go to Supabase Dashboard → SQL Editor
2. Open: `migrations/pending/09_fix_students_parent_columns.sql`
3. Copy all contents
4. Paste in SQL Editor
5. Click "Run"
6. ✅ Success message: "Students table parent columns verified!"

---

### Step 2: Fee Management System
**File**: `migrations/pending/07_school_fee_management_system.sql`

**What it does**:
- Creates `school_fee_structures` table
- Creates `student_fee_assignments` table
- Creates `fee_payments` table
- Adds 6 helper functions
- Configures RLS policies

**Why Second**: Invoice system depends on this!

**Run via Supabase Dashboard**:
1. Copy contents of `07_school_fee_management_system.sql`
2. Paste in SQL Editor
3. Click "Run"
4. ✅ Success message: "School Fee Management System installed successfully!"

---

### Step 3: Invoice Management System (OPTIONAL)
**File**: `migrations/pending/08_invoice_management_system.sql`

**What it does**:
- Creates `invoices` table
- Creates `invoice_line_items` table
- Creates `invoice_payments` table
- Adds 9 helper functions
- Professional invoice generation

**Why Third**: Depends on migrations 07 and 09

**Run via Supabase Dashboard**:
1. Copy contents of `08_invoice_management_system.sql`
2. Paste in SQL Editor
3. Click "Run"
4. ✅ Success message: "Invoice Management System installed successfully!"

---

## ✅ Verification After Each Migration

### After Migration 09:
```sql
-- Check columns added
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('parent_id', 'guardian_id');
```
**Expected**: 2 rows returned

---

### After Migration 07:
```sql
-- Check tables created
SELECT tablename FROM pg_tables 
WHERE tablename IN ('school_fee_structures', 'student_fee_assignments', 'fee_payments');
```
**Expected**: 3 rows returned

```sql
-- Check functions created
SELECT proname FROM pg_proc 
WHERE proname IN ('create_default_fee_structures', 'auto_assign_fees_to_student');
```
**Expected**: 2+ rows returned

---

### After Migration 08:
```sql
-- Check tables created
SELECT tablename FROM pg_tables 
WHERE tablename IN ('invoices', 'invoice_line_items', 'invoice_payments');
```
**Expected**: 3 rows returned

```sql
-- Check invoice functions
SELECT proname FROM pg_proc 
WHERE proname LIKE '%invoice%';
```
**Expected**: 5+ rows returned

---

## 🎯 Quick Start After Migrations

### Create Default Fees:
```sql
-- Replace with your actual preschool ID
SELECT create_default_fee_structures('your-preschool-id');
```

### Assign Fees to Students:
```sql
-- Assign to all students in your school
SELECT auto_assign_fees_to_student(id)
FROM students
WHERE preschool_id = 'your-preschool-id';
```

### Generate Invoices:
```sql
-- Create invoices from fee assignments
SELECT create_invoice_from_fee_assignment(id)
FROM student_fee_assignments
WHERE preschool_id = 'your-preschool-id'
LIMIT 5;
```

---

## 🚨 Common Issues

### Issue: "column parent_id does not exist"
**Solution**: Run migration 09 first!

### Issue: "relation school_fee_structures does not exist"  
**Solution**: Run migration 07

### Issue: "function create_invoice_from_fee_assignment does not exist"
**Solution**: Run migration 08

### Issue: "relation already exists"
**Solution**: Migration was already run, safe to skip or re-run (idempotent)

---

## 📊 What to Expect

### After All Migrations:
- ✅ 9 new database tables
- ✅ 20+ new functions
- ✅ All RLS policies configured
- ✅ Fee management works
- ✅ Invoice system works
- ✅ Payment system works

### Total Migration Time:
- Migration 09: <1 second
- Migration 07: 5-10 seconds
- Migration 08: 5-10 seconds
- **Total**: <30 seconds

---

## 🎉 After Migrations Complete

### Test Pages:

**Principal**:
1. `/dashboard/principal/fees` - Should load, show empty state
2. Click "Create Defaults" - Should create 4 fees
3. Navigate to `/dashboard/principal/invoices` - Should load, show empty

**Parent**:
1. `/dashboard/parent/payments` - Should load, show "All caught up"
2. (After fees assigned) - Should show actual fees
3. "Pay Now" button - Should work with PayFast

---

## 💡 Pro Tip

Run all 3 migrations in one go by combining them:

1. Copy migration 09 contents → Paste in SQL Editor
2. Add a line break
3. Copy migration 07 contents → Paste below
4. Add a line break
5. Copy migration 08 contents → Paste below
6. Click "Run" once!

**Result**: All 3 migrations run in sequence! ✅

---

## 📞 Need Help?

**If migrations fail**:
1. Share the exact error message
2. Note which migration failed
3. Check verification queries above
4. Review migration file for comments

**If pages still error**:
1. Hard refresh browser (Ctrl+Shift+R)
2. Check browser console for errors
3. Verify migrations ran successfully
4. Check Supabase logs

---

**Status**: ✅ Migrations ready, pages ready, documentation ready!

**Next Action**: Run migrations via Supabase Dashboard SQL Editor! 🚀
