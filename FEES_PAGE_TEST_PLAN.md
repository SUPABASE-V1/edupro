# 🧪 Fees Page Testing Plan

## 🎯 What to Test

### Parent Fees Page: `/dashboard/parent/payments`
### Principal Fees Page: `/dashboard/principal/fees`

---

## ⚠️ Before Testing - Run Migrations!

**IMPORTANT**: These pages will throw errors until migrations are run.

### Migration Order:
```
1. migrations/pending/09_fix_students_parent_columns.sql (FIRST!)
2. migrations/pending/07_school_fee_management_system.sql
3. migrations/pending/08_invoice_management_system.sql (OPTIONAL - only if you want invoices)
```

**How to Run** (via Supabase Dashboard):
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of migration file
3. Paste into editor
4. Click "Run"
5. Check for success message

---

## 📊 Expected Behavior

### BEFORE Migrations:

#### Parent Fees Page:
**Error**: Table `student_fee_assignments` does not exist
- Page will crash or show error
- No fees display

#### Principal Fees Page:
**Error**: Table `school_fee_structures` does not exist
- Page will crash or show error
- No fee management available

---

### AFTER Migrations:

#### Parent Fees Page (`/dashboard/parent/payments`):
**Should Show**:
- ✅ Outstanding balance card (R0.00 if no fees)
- ✅ Next payment due card (None if no fees)
- ✅ Total this month card (R0.00)
- ✅ 3 tabs: Upcoming, Payment History, Upload Proof
- ✅ "Pay Now with PayFast" button (if fees exist)
- ✅ Fee structure section

**If No Fees Assigned**:
- Shows R0.00 everywhere
- "All caught up!" message
- Empty fee list

**If Fees Exist**:
- Shows actual amounts
- Lists upcoming payments
- "Pay Now" button active

---

#### Principal Fees Page (`/dashboard/principal/fees`):
**Should Show**:
- ✅ Summary cards (collected, outstanding, students, overdue)
- ✅ "Create Defaults" button (if no fees exist)
- ✅ "Add Fee" button
- ✅ Fee structure list (if fees exist)
- ✅ Edit/Delete buttons per fee
- ✅ How-it-works info box

**If No Fees Exist**:
- Empty state with "Create Default Fee Structure" button
- Clicking creates 4 standard fees

**If Fees Exist**:
- Lists all fee structures
- Shows amounts, age groups, frequencies
- Edit/delete actions

---

## 🧪 Test Scenarios

### Test 1: Parent Fees Page (No Fees)
**Steps**:
1. Login as parent
2. Navigate to `/dashboard/parent/payments`

**Expected**:
- ✅ Page loads without errors
- ✅ Shows "All caught up!" (no fees)
- ✅ R0.00 balance
- ✅ Fee structure section empty or shows school's fee templates

---

### Test 2: Principal Fees Page (First Visit)
**Steps**:
1. Login as principal
2. Navigate to `/dashboard/principal/fees`

**Expected**:
- ✅ Page loads without errors
- ✅ Shows empty state: "No Fee Structures Yet"
- ✅ "Create Default Fee Structure" button visible
- ✅ Summary shows all zeros

---

### Test 3: Create Default Fees
**Steps**:
1. On principal fees page
2. Click "Create Default Fee Structure"
3. Confirm dialog

**Expected**:
- ✅ Alert: "Created 4 default fee structures!"
- ✅ Page reloads
- ✅ Shows 4 fees:
  - Toddlers Monthly Fee (R1,500)
  - Preschool Monthly Fee (R1,200)
  - Grade R Monthly Fee (R1,000)
  - Registration Fee (R500)

---

### Test 4: Parent Sees Fees (After Assignment)
**Steps**:
1. As principal: Create fees
2. Run SQL: `SELECT auto_assign_fees_to_student('student-id');`
3. As parent: Reload `/dashboard/parent/payments`

**Expected**:
- ✅ Shows actual fee amounts
- ✅ Outstanding balance > R0.00
- ✅ Fees listed in "Upcoming" tab
- ✅ "Pay Now with PayFast" button appears

---

## 🚨 Common Errors & Solutions

### Error: "relation 'school_fee_structures' does not exist"
**Cause**: Migration 07 not run  
**Fix**: Run migration 07 via Supabase Dashboard

### Error: "column 'parent_id' does not exist"
**Cause**: Migration 09 not run  
**Fix**: Run migration 09 FIRST, then 07, then 08

### Error: "Cannot read property 'map' of undefined"
**Cause**: Empty data arrays  
**Fix**: Page should handle this gracefully (check for null/undefined)

### Error: "Failed to fetch fees"
**Cause**: RLS policy blocking access  
**Fix**: Check user is logged in as correct role

---

## ✅ Success Criteria

### Parent Fees Page Works When:
- ✅ Page loads without crash
- ✅ Shows balance (even if R0.00)
- ✅ "Pay Now" button appears if fees exist
- ✅ Fee structure displays
- ✅ No console errors

### Principal Fees Page Works When:
- ✅ Page loads without crash
- ✅ Shows summary cards (even if zeros)
- ✅ Can create default fees
- ✅ Fee list displays
- ✅ Edit/delete buttons work
- ✅ No console errors

---

## 🔍 How to Debug

### Check Database:
```sql
-- Check if tables exist
SELECT tablename FROM pg_tables WHERE tablename LIKE '%fee%';
-- Should return: school_fee_structures, student_fee_assignments, fee_payments

-- Check if fees exist
SELECT COUNT(*) FROM school_fee_structures;

-- Check if assignments exist
SELECT COUNT(*) FROM student_fee_assignments;
```

### Check Browser Console:
- Look for network errors (404, 403, 500)
- Check for missing data errors
- Verify auth token present

### Check Supabase Logs:
- Go to Supabase Dashboard → Logs
- Filter by time of page load
- Look for RLS policy violations

---

## 📞 Report Back

After testing, please share:

1. **Parent Fees Page**:
   - Does it load? (Yes/No)
   - Any errors? (Paste error)
   - What does it show? (Screenshot or description)

2. **Principal Fees Page**:
   - Does it load? (Yes/No)
   - Any errors? (Paste error)
   - Can you create fees? (Yes/No)

3. **Migration Status**:
   - Which migrations ran successfully?
   - Any migration errors? (Paste exact error)

---

## 🚀 Quick Test Commands

### Via Supabase Dashboard SQL Editor:

**Check students table**:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
```

**Check fee tables**:
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('school_fee_structures', 'student_fee_assignments', 'fee_payments');
```

**Test fee creation**:
```sql
SELECT create_default_fee_structures('your-preschool-id');
```

---

**Status**: ✅ Navigation updated, migrations ready to run!

**Next**: Run migrations in order (09 → 07 → 08), then test pages! 🎯
