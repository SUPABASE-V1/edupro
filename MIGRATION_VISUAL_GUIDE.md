# 🗄️ Database Migrations - Visual Guide

## Migration Order (MUST follow exactly!)

```
┌─────────────────────────────────────────────────────────────┐
│  START: Your Database                                       │
│  Missing: parent_id columns, fee tables, invoice tables    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  MIGRATION 09: Fix Students Table                          │
│  File: migrations/pending/09_fix_students_parent_columns.sql│
│                                                              │
│  ADDS:                                                       │
│  ✅ students.parent_id (UUID)                               │
│  ✅ students.guardian_id (UUID)                             │
│  ✅ Indexes for performance                                 │
│  ✅ Migrates data from old parent_ids array                 │
│                                                              │
│  WHY FIRST: Everything else needs these columns!            │
│  TIME: <1 second                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  MIGRATION 07: Fee Management System                        │
│  File: migrations/pending/07_school_fee_management_system.sql│
│                                                              │
│  CREATES:                                                    │
│  ✅ school_fee_structures (fee templates)                   │
│  ✅ student_fee_assignments (who owes what)                 │
│  ✅ fee_payments (payment tracking)                         │
│  ✅ 6 helper functions                                       │
│  ✅ RLS policies (security)                                  │
│  ✅ Triggers (auto-balance updates)                          │
│                                                              │
│  USES: students.parent_id (from Migration 09)               │
│  TIME: 5-10 seconds                                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  MIGRATION 08: Invoice Management System (Optional)         │
│  File: migrations/pending/08_invoice_management_system.sql  │
│                                                              │
│  CREATES:                                                    │
│  ✅ invoices (invoice headers)                              │
│  ✅ invoice_line_items (itemized charges)                   │
│  ✅ invoice_payments (payment tracking)                     │
│  ✅ 9 helper functions                                       │
│  ✅ Auto invoice generation                                  │
│  ✅ Invoice numbering system                                 │
│  ✅ PDF generation support (backend)                         │
│                                                              │
│  USES: fee tables (from Migration 07)                       │
│  TIME: 5-10 seconds                                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  MIGRATION (AI Fix): AI Usage Logging                       │
│  SQL: ALTER TABLE ai_usage_logs...                          │
│                                                              │
│  FIXES:                                                      │
│  ✅ Makes ai_service_id nullable                            │
│  ✅ Allows AI usage to be logged                            │
│  ✅ Fixes 400 errors in Edge Function                       │
│                                                              │
│  TIME: <1 second                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  END: Fully Configured Database                             │
│  ✅ Fee management ready                                     │
│  ✅ Invoice system ready                                     │
│  ✅ AI logging working                                       │
│  ✅ All parent/student relationships correct                 │
└─────────────────────────────────────────────────────────────┘
```

---

## What Each Migration Does (Detailed)

### Migration 09: Students Table Fix

**Problem it solves**:
- Old schema had `parent_ids UUID[]` (array)
- New code expects `parent_id UUID` (single)
- Fee/invoice systems need `parent_id` for RLS policies

**What it adds**:
```sql
ALTER TABLE students 
ADD COLUMN parent_id UUID REFERENCES profiles(id);

ALTER TABLE students 
ADD COLUMN guardian_id UUID REFERENCES profiles(id);

-- Migrate data from old array to new column
UPDATE students 
SET parent_id = parent_ids[1] 
WHERE parent_ids IS NOT NULL;
```

**After this**:
- ✅ `students.parent_id` exists
- ✅ `students.guardian_id` exists
- ✅ Data migrated from old format
- ✅ Indexes created for performance

---

### Migration 07: Fee Management

**Problem it solves**:
- Schools need to configure fees
- Parents need to see what they owe
- System needs to track payments

**What it creates**:

#### Table 1: `school_fee_structures`
```
Stores fee templates configured by principals:
- Toddlers Monthly Fee: R1,500
- Grade R Registration: R500
- School Bus Monthly: R300
```

#### Table 2: `student_fee_assignments`
```
Links fees to specific students:
- Student: John Smith
- Fee: Toddlers Monthly Fee
- Amount: R1,500
- Due: 2025-11-05
- Balance: R1,500
```

#### Table 3: `fee_payments`
```
Tracks payments:
- Assignment: #123
- Amount: R500
- Method: PayFast
- Status: Complete
```

#### Functions:
```
create_default_fee_structures() - Creates 4 standard fees
auto_assign_fees_to_student() - Assigns fees based on age
get_parent_outstanding_fees() - Shows what parents owe
get_school_fee_summary() - Shows school financials
```

**After this**:
- ✅ Principals can create fees
- ✅ System assigns fees to students
- ✅ Parents see what they owe
- ✅ PayFast integration works

---

### Migration 08: Invoice System

**Problem it solves**:
- Schools need professional invoices
- Parents need invoice records
- Accountants need proper documentation

**What it creates**:

#### Table 1: `invoices`
```
Invoice headers:
- Invoice #: INV-2025-0001
- Parent: Jane Doe
- Total: R1,800
- Status: Paid
- Due: 2025-11-10
```

#### Table 2: `invoice_line_items`
```
Itemized charges:
- Invoice: INV-2025-0001
- Item: Toddlers Monthly Fee
- Quantity: 1
- Amount: R1,500
- Subtotal: R1,500
```

#### Table 3: `invoice_payments`
```
Payment records:
- Invoice: INV-2025-0001
- Amount: R1,800
- Method: PayFast
- Reference: PF123456
```

#### Functions:
```
generate_invoice_number() - Auto-incrementing INV-2025-0001
create_invoice_from_fee_assignment() - Auto-generate invoices
get_parent_invoices() - Fetch parent's invoices
get_school_invoice_summary() - Financial reports
mark_overdue_invoices() - Auto-mark late payments
```

**After this**:
- ✅ Professional invoices generated
- ✅ Parents receive PDF invoices (backend ready)
- ✅ Payments tracked properly
- ✅ Accounting reports available

---

### AI Logging Fix

**Problem it solves**:
- Edge Function tries to log AI usage
- Table requires `ai_service_id` (foreign key)
- Edge Function doesn't send it
- Insert fails → 400 error

**What it does**:
```sql
ALTER TABLE ai_usage_logs 
ALTER COLUMN ai_service_id DROP NOT NULL;
```

**After this**:
- ✅ AI usage is logged
- ✅ No more 400 errors
- ✅ Quota tracking works
- ✅ Cost tracking works

---

## Visual: Data Flow After Migrations

```
┌─────────────┐
│  Principal  │
│   (Admin)   │
└──────┬──────┘
       │ 1. Creates fee structures
       ↓
┌──────────────────────┐
│ school_fee_structures│
│ - Toddlers: R1,500   │
│ - Grade R: R1,200    │
└──────┬───────────────┘
       │ 2. Auto-assigns to students
       ↓
┌──────────────────────┐      ┌─────────────┐
│student_fee_assignments│←─────┤  Students   │
│ - John: R1,500 due   │      │ + parent_id │ ← Migration 09!
│ - Balance: R1,500    │      └─────────────┘
└──────┬───────────────┘
       │ 3. Parent sees fees
       ↓
┌──────────────┐
│    Parent    │
│  Dashboard   │
└──────┬───────┘
       │ 4. Pays with PayFast
       ↓
┌──────────────────┐      ┌─────────────────┐
│  fee_payments    │      │    invoices     │ ← Migration 08
│ - R500 paid      │──┬───│ INV-2025-0001   │
│ - PayFast ref    │  │   └─────────────────┘
└──────────────────┘  │
                      │   ┌──────────────────┐
                      └───│invoice_line_items│
                          │ - Itemized       │
                          └──────────────────┘
```

---

## Verification Commands (After Each Migration)

### After Migration 09:
```sql
-- Should show 2 columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('parent_id', 'guardian_id');
```

### After Migration 07:
```sql
-- Should show 3 tables
SELECT tablename 
FROM pg_tables 
WHERE tablename IN (
  'school_fee_structures', 
  'student_fee_assignments', 
  'fee_payments'
);

-- Should show at least 4 functions
SELECT proname 
FROM pg_proc 
WHERE proname LIKE '%fee%';
```

### After Migration 08:
```sql
-- Should show 3 tables
SELECT tablename 
FROM pg_tables 
WHERE tablename IN (
  'invoices', 
  'invoice_line_items', 
  'invoice_payments'
);

-- Should show at least 5 functions
SELECT proname 
FROM pg_proc 
WHERE proname LIKE '%invoice%';
```

### After AI Fix:
```sql
-- Should return 'YES'
SELECT is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ai_usage_logs' 
  AND column_name = 'ai_service_id';
```

---

## Common Errors & Solutions

### Error: "column already exists"
**Cause**: Migration ran before  
**Solution**: Skip to next migration (it's already done!)

### Error: "column parent_id does not exist"
**Cause**: Migration 09 not run yet  
**Solution**: Run Migration 09 first!

### Error: "relation school_fee_structures does not exist"
**Cause**: Migration 07 not run yet  
**Solution**: Run Migration 07

### Error: "permission denied"
**Cause**: Not database admin  
**Solution**: Check you're using correct Supabase project

---

## Timeline

```
Migration 09: <1 second
Migration 07: 5-10 seconds
Migration 08: 5-10 seconds
AI Fix:       <1 second
─────────────────────────────
Total:        ~15-20 seconds
```

**Plus your time**: 3-5 minutes to copy/paste/verify

---

## Success! What You Now Have:

✅ **For Principals**:
- Create fee structures (monthly fees, registration, etc.)
- Auto-assign fees to students by age group
- View financial summaries
- Generate invoices

✅ **For Parents**:
- See outstanding balance
- View itemized fees
- Pay online with PayFast
- Receive professional invoices

✅ **For Dash AI**:
- Usage logging works
- Quota tracking enabled
- Cost calculation accurate
- No more 400 errors

✅ **For Developers**:
- Clean data model
- Proper relationships
- RLS security enabled
- Helper functions available

---

**Ready?** Start with Migration 09! 🚀
