# 📄 Invoice System - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Run Migrations (2 minutes)

**You need to run BOTH migrations in order**:

```bash
# 1. Fee Management (if not already done)
psql $DB_URL -f migrations/pending/07_school_fee_management_system.sql

# 2. Invoice System
psql $DB_URL -f migrations/pending/08_invoice_management_system.sql
```

**Or via Supabase Dashboard**:
1. Go to SQL Editor
2. Copy `07_school_fee_management_system.sql` → Run
3. Copy `08_invoice_management_system.sql` → Run

---

### Step 2: Test It! (3 minutes)

#### Option A: Auto-Generate Invoice from Fee

```sql
-- 1. Create a fee assignment (or use existing one)
SELECT id FROM student_fee_assignments LIMIT 1;

-- 2. Generate invoice
SELECT create_invoice_from_fee_assignment('your-fee-assignment-id');

-- 3. Check invoice created
SELECT invoice_number, student_name, total_cents, status 
FROM invoices 
ORDER BY created_at DESC 
LIMIT 1;
```

#### Option B: View in Principal Dashboard

1. Login as principal
2. Go to `/dashboard/principal/invoices`
3. See your invoices!

---

## ✅ What Works NOW

### Automated Invoices ✅
- **Trigger**: Call `create_invoice_from_fee_assignment(fee_id)`
- **Includes**: School name, student details, fee breakdown
- **Format**: Professional invoice with auto-generated number

### Manual Invoices ⏳
- **UI**: Placeholder modal (form coming soon)
- **Database**: Fully ready for manual invoices
- **Can Create**: Via SQL until UI is done:

```sql
-- Generate invoice number
SELECT generate_invoice_number('preschool-id');

-- Create manual invoice
INSERT INTO invoices (
  invoice_number,
  invoice_type,
  preschool_id,
  student_id,
  invoice_date,
  due_date,
  bill_to_name,
  student_name,
  total_cents,
  status
) VALUES (
  'INV-2025-10-0001',  -- Use generated number
  'manual',
  'preschool-id',
  'student-id',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  'Parent Name',
  'Student Name',
  150000,  -- R1,500.00
  'draft'
);

-- Add line items
INSERT INTO invoice_line_items (
  invoice_id,
  line_number,
  description,
  quantity,
  unit_price_cents,
  amount_cents
) VALUES (
  'invoice-id',
  1,
  'Field Trip to Zoo',
  1,
  150000,
  150000
);
```

---

## 📊 Principal Features

### Invoice Dashboard (`/dashboard/principal/invoices`)

**Summary Cards** show:
- Total invoices
- Total invoiced amount
- Total collected
- Outstanding balance
- Overdue count

**Tabs**:
- All Invoices
- Outstanding
- Overdue
- Paid

**Actions**:
- ✅ View invoice
- ✅ Download PDF (coming soon)
- ✅ Send email (coming soon)
- ✅ Delete draft

---

## 👨‍👩‍👧 Parent Features (Coming Soon)

Will be added to `/dashboard/parent/payments`:
- View all invoices
- Download PDF
- Pay online button
- Invoice status tracking

---

## 🔧 Configuration

### School Details (Required for Professional Invoices)

Make sure your `preschools` table has:

```sql
UPDATE preschools SET
  name = 'Your School Name',
  address = '123 Main Street, Cape Town, 8001',
  phone = '021-123-4567',
  email = 'info@yourschool.co.za'
WHERE id = 'your-preschool-id';
```

### Optional: Enable Auto-Invoice on Fee Assignment

Uncomment the trigger in `07_school_fee_management_system.sql`:

```sql
-- Find this section at the bottom of the file
-- Remove the /* and */ to enable

CREATE TRIGGER auto_create_invoice_on_fee_assignment
  AFTER INSERT ON student_fee_assignments
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_invoice_on_fee_assignment();
```

**Then re-run the migration!**

---

## 🎯 Usage Examples

### Example 1: Generate Invoice for Fee Assignment

```sql
-- Principal creates fee structure
SELECT create_default_fee_structures('preschool-id');

-- System assigns fees to students
SELECT auto_assign_fees_to_student('student-id');

-- Create invoice from the fee assignment
SELECT create_invoice_from_fee_assignment(
  (SELECT id FROM student_fee_assignments WHERE student_id = 'student-id' LIMIT 1)
);

-- Check result
SELECT * FROM invoices WHERE student_id = 'student-id';
```

### Example 2: Manual Invoice for Field Trip

```sql
-- 1. Generate number
SELECT generate_invoice_number('preschool-id');
-- Returns: INV-2025-10-0005

-- 2. Create invoice
INSERT INTO invoices (
  invoice_number, invoice_type, preschool_id, student_id,
  invoice_date, due_date, bill_to_name, student_name,
  total_cents, status, notes
) VALUES (
  'INV-2025-10-0005', 'manual', 'preschool-id', 'student-id',
  '2025-10-31', '2025-11-15', 'Mr. & Mrs. Smith', 'Johnny Smith',
  5000, 'draft', 'Payment for zoo field trip'
)
RETURNING id;

-- 3. Add line item
INSERT INTO invoice_line_items (
  invoice_id, line_number, description, quantity, unit_price_cents, amount_cents
) VALUES (
  'invoice-id', 1, 'Zoo Field Trip - Transportation & Entry', 1, 5000, 5000
);

-- 4. Mark as sent
UPDATE invoices SET status = 'sent', sent_at = NOW() WHERE id = 'invoice-id';
```

### Example 3: Record Payment

```sql
-- Parent pays invoice
INSERT INTO invoice_payments (
  invoice_id, amount_cents, payment_date, payment_method, payment_reference
) VALUES (
  'invoice-id', 150000, '2025-11-01', 'payfast', 'PF-123456'
);

-- Invoice status automatically updates to 'paid'!
```

---

## 📋 SQL Functions Reference

### Generate Invoice Number
```sql
SELECT generate_invoice_number('preschool-id');
-- Returns: INV-2025-10-0001
```

### Create Invoice from Fee
```sql
SELECT create_invoice_from_fee_assignment('fee-assignment-id', 'due-date');
-- Returns: invoice-id (UUID)
```

### Get Parent Invoices
```sql
SELECT * FROM get_parent_invoices('parent-id');
-- Returns: All invoices for parent's children
```

### Get School Summary
```sql
SELECT * FROM get_school_invoice_summary('preschool-id');
-- Returns: JSON with financial summary
```

### Mark Overdue Invoices
```sql
SELECT mark_overdue_invoices();
-- Returns: Number of invoices marked overdue
```

---

## 🎨 Professional Invoice Features

### Included Automatically:
- ✅ School name and address
- ✅ Student full name
- ✅ Student number
- ✅ Grade level
- ✅ Auto-generated invoice number (INV-YYYY-MM-####)
- ✅ Invoice date
- ✅ Due date
- ✅ Itemized line items
- ✅ Subtotal, tax, discounts
- ✅ Total and balance
- ✅ Payment terms
- ✅ Custom notes

### Coming Soon:
- School logo
- PDF generation
- Email delivery
- WhatsApp notifications
- Customizable templates

---

## 🔍 Verification Queries

### Check Invoices Created
```sql
SELECT 
  invoice_number,
  invoice_type,
  student_name,
  total_cents / 100.0 as total_rands,
  status,
  created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 10;
```

### Check Invoice Line Items
```sql
SELECT 
  i.invoice_number,
  li.line_number,
  li.description,
  li.amount_cents / 100.0 as amount_rands
FROM invoice_line_items li
JOIN invoices i ON li.invoice_id = i.id
ORDER BY i.created_at DESC, li.line_number;
```

### Check Payment Status
```sql
SELECT 
  invoice_number,
  total_cents / 100.0 as total,
  paid_cents / 100.0 as paid,
  balance_cents / 100.0 as balance,
  status
FROM invoices
WHERE preschool_id = 'your-preschool-id'
ORDER BY due_date;
```

---

## 🚨 Troubleshooting

### "Function create_invoice_from_fee_assignment does not exist"
**Solution**: Run migration `08_invoice_management_system.sql`

### "Invoice shows R0.00"
**Solution**: Check fee assignment has `total_amount_cents > 0`

### "No invoices appear in UI"
**Solution**: 
1. Check you're logged in as principal
2. Verify preschool_id matches
3. Run: `SELECT * FROM invoices WHERE preschool_id = 'your-id'`

### "Can't generate invoice from fee"
**Solution**: 
1. Check fee assignment exists: `SELECT * FROM student_fee_assignments WHERE id = 'fee-id'`
2. Check student exists: `SELECT * FROM students WHERE id = 'student-id'`
3. Check preschool exists: `SELECT * FROM preschools WHERE id = 'preschool-id'`

---

## 📦 What's Included

### Database Tables (3):
- `invoices` - Main invoice records
- `invoice_line_items` - Itemized charges
- `invoice_payments` - Payment tracking

### Functions (9):
- `generate_invoice_number()`
- `create_invoice_from_fee_assignment()`
- `get_parent_invoices()`
- `get_school_invoice_summary()`
- `mark_overdue_invoices()`
- Plus 4 trigger functions

### UI Pages (1):
- `/dashboard/principal/invoices` - Full invoice management

---

## 🎯 Next Steps

1. ✅ Run migrations
2. ✅ Test invoice creation
3. ⏳ Build manual invoice form (1-2 hours)
4. ⏳ Add PDF generation (2-3 hours)
5. ⏳ Add parent invoice view (1 hour)
6. ⏳ Email delivery (2 hours)

---

**Status**: ✅ **CORE SYSTEM READY - START USING NOW!**

**Automated invoices work!** Just call `create_invoice_from_fee_assignment()` 🚀
