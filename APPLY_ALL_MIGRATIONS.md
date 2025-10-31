# 🚀 Apply All Pending Migrations

## 📋 Migration Summary

Total pending migrations: **7**

| # | File | Description | Status |
|---|------|-------------|--------|
| 1 | `01_guest_mode_rate_limiting.sql` | Guest rate limiting system | ⏳ Pending |
| 2 | `02_fix_trial_period_to_7_days.sql` | Standardize trial to 7 days | ⏳ Pending |
| 3 | `03_seed_mvp_content.sql` | Grade 9 Math content | ⏳ Pending |
| 4 | `04_exam_assignments_system.sql` | Exam assignment tables | ⏳ Pending |
| 5 | `05_trigger_trials_for_existing_users.sql` | Grant trials to existing users | ⏳ Pending |
| 6 | `06_standardize_trial_period.sql` | System-wide trial config | ⏳ Pending |
| 7 | `07_school_fee_management_system.sql` | **Fee management system** | ⏳ Pending |

---

## 🎯 Quick Apply (All at Once)

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of **ALL** the migrations below in order
4. Click **Run**

### Option 2: Via Command Line

```bash
# Set your database connection string
export DB_URL="postgresql://postgres:[password]@[host]:6543/postgres"

# Run all migrations in order
psql $DB_URL -f migrations/pending/01_guest_mode_rate_limiting.sql
psql $DB_URL -f migrations/pending/02_fix_trial_period_to_7_days.sql
psql $DB_URL -f migrations/pending/03_seed_mvp_content.sql
psql $DB_URL -f migrations/pending/04_exam_assignments_system.sql
psql $DB_URL -f migrations/pending/05_trigger_trials_for_existing_users.sql
psql $DB_URL -f migrations/pending/06_standardize_trial_period.sql
psql $DB_URL -f migrations/pending/07_school_fee_management_system.sql
```

### Option 3: Combined SQL File

```bash
# Create combined migration
cat migrations/pending/*.sql > /tmp/all_migrations.sql

# Apply
psql $DB_URL -f /tmp/all_migrations.sql
```

---

## 📝 Step-by-Step Guide

### Step 1: Guest Mode Rate Limiting

**File**: `01_guest_mode_rate_limiting.sql`

**What it does**:
- Creates `guest_rate_limits` table
- Adds RPC function `check_guest_limit()`
- Tracks guest usage by IP address

**Run**:
```bash
psql $DB_URL -f migrations/pending/01_guest_mode_rate_limiting.sql
```

**Verify**:
```sql
SELECT * FROM pg_tables WHERE tablename = 'guest_rate_limits';
SELECT * FROM pg_proc WHERE proname = 'check_guest_limit';
```

---

### Step 2: Fix Trial Period to 7 Days

**File**: `02_fix_trial_period_to_7_days.sql`

**What it does**:
- Updates `create_trial_subscription()` to use 7 days
- Standardizes trial messaging

**Run**:
```bash
psql $DB_URL -f migrations/pending/02_fix_trial_period_to_7_days.sql
```

**Verify**:
```sql
-- Check function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'create_trial_subscription';
```

---

### Step 3: Seed MVP Content

**File**: `03_seed_mvp_content.sql`

**What it does**:
- Adds Grade 9 Mathematics past papers
- Seeds sample questions

**Run**:
```bash
psql $DB_URL -f migrations/pending/03_seed_mvp_content.sql
```

**Verify**:
```sql
SELECT COUNT(*) FROM caps_documents WHERE grade_level = '9' AND subject = 'Mathematics';
SELECT COUNT(*) FROM caps_exam_questions WHERE subject = 'Mathematics';
```

---

### Step 4: Exam Assignments System

**File**: `04_exam_assignments_system.sql`

**What it does**:
- Creates `exam_assignments` table
- Creates `exam_submissions` table
- Adds helper functions for assignment management

**Run**:
```bash
psql $DB_URL -f migrations/pending/04_exam_assignments_system.sql
```

**Verify**:
```sql
SELECT * FROM pg_tables WHERE tablename IN ('exam_assignments', 'exam_submissions');
```

---

### Step 5: Trigger Trials for Existing Users

**File**: `05_trigger_trials_for_existing_users.sql`

**What it does**:
- Grants 7-day trial to all existing schools without active subscriptions
- Updates free-tier subscriptions to trialing status

**Run**:
```bash
psql $DB_URL -f migrations/pending/05_trigger_trials_for_existing_users.sql
```

**Verify**:
```sql
-- Check how many schools got trials
SELECT COUNT(*) FROM subscriptions WHERE status = 'trialing';
```

---

### Step 6: Standardize Trial Period

**File**: `06_standardize_trial_period.sql`

**What it does**:
- Creates `system_config` table (single source of truth)
- Updates all trial-related functions
- Sets trial_days to 7 globally

**Run**:
```bash
psql $DB_URL -f migrations/pending/06_standardize_trial_period.sql
```

**Verify**:
```sql
SELECT * FROM system_config WHERE config_key = 'trial_days';
```

---

### Step 7: School Fee Management System ⭐

**File**: `07_school_fee_management_system.sql`

**What it does**:
- Creates `school_fee_structures` table
- Creates `student_fee_assignments` table
- Creates `fee_payments` table
- Adds auto-assignment functions
- Configures RLS policies
- Sets up PayFast integration

**Run**:
```bash
psql $DB_URL -f migrations/pending/07_school_fee_management_system.sql
```

**Verify**:
```sql
-- Check tables
SELECT * FROM pg_tables WHERE tablename LIKE '%fee%';

-- Check functions
SELECT proname FROM pg_proc WHERE proname LIKE '%fee%';

-- Sample: Create default fees for a school
SELECT create_default_fee_structures('your-preschool-id');
```

---

## ✅ Verification Checklist

After running all migrations, verify:

```sql
-- 1. Check all tables exist
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'guest_rate_limits',
  'exam_assignments',
  'exam_submissions',
  'school_fee_structures',
  'student_fee_assignments',
  'fee_payments',
  'system_config'
);
-- Should return 7 rows

-- 2. Check functions exist
SELECT proname 
FROM pg_proc 
WHERE proname IN (
  'check_guest_limit',
  'create_trial_subscription',
  'get_parent_outstanding_fees',
  'get_school_fee_summary',
  'auto_assign_fees_to_student',
  'create_default_fee_structures'
);
-- Should return 6 rows

-- 3. Check trial config
SELECT * FROM system_config WHERE config_key = 'trial_days';
-- Should return: trial_days = 7

-- 4. Check content seeded
SELECT COUNT(*) FROM caps_documents WHERE grade_level = '9';
-- Should return > 0

-- 5. Check trial users
SELECT COUNT(*) FROM subscriptions WHERE status = 'trialing';
-- Should return number of schools given trials
```

---

## 🔧 Rollback (If Needed)

If something goes wrong, you can rollback each migration:

```sql
-- Rollback fee management system
DROP TABLE IF EXISTS fee_payments CASCADE;
DROP TABLE IF EXISTS student_fee_assignments CASCADE;
DROP TABLE IF EXISTS school_fee_structures CASCADE;
DROP FUNCTION IF EXISTS get_parent_outstanding_fees CASCADE;
DROP FUNCTION IF EXISTS get_school_fee_summary CASCADE;
DROP FUNCTION IF EXISTS auto_assign_fees_to_student CASCADE;
DROP FUNCTION IF EXISTS create_default_fee_structures CASCADE;

-- Rollback system config
DROP TABLE IF EXISTS system_config CASCADE;

-- Rollback exam assignments
DROP TABLE IF EXISTS exam_submissions CASCADE;
DROP TABLE IF EXISTS exam_assignments CASCADE;

-- Rollback guest rate limiting
DROP TABLE IF EXISTS guest_rate_limits CASCADE;
DROP FUNCTION IF EXISTS check_guest_limit CASCADE;
```

---

## 🚨 Common Issues

### Issue 1: "relation already exists"
**Solution**: Table already created, skip that migration or drop and recreate

### Issue 2: "function already exists"
**Solution**: Use `CREATE OR REPLACE FUNCTION` or drop existing function first

### Issue 3: "column does not exist"
**Solution**: Check table schema, may need to run dependent migration first

### Issue 4: "permission denied"
**Solution**: Ensure you're using postgres user or service role

---

## 📊 Post-Migration Setup

### 1. Configure PayFast (Required for Fee Management)

Add to `.env.local`:
```bash
PAYFAST_MERCHANT_ID=your-merchant-id
PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-secure-passphrase
PAYFAST_SANDBOX=true  # Start with sandbox
```

### 2. Create Default Fees (Optional)

As a principal:
1. Login to your principal account
2. Navigate to `/dashboard/principal/fees`
3. Click **"Create Defaults"**
4. This creates 4 standard fee structures for your school

Or via SQL:
```sql
SELECT create_default_fee_structures('your-preschool-id');
```

### 3. Assign Fees to Students

Auto-assign fees to all students in a school:
```sql
SELECT auto_assign_fees_to_student(id)
FROM profiles
WHERE preschool_id = 'your-preschool-id'
  AND role = 'student';
```

### 4. Test Parent View

As a parent:
1. Login to your parent account
2. Navigate to `/dashboard/parent/payments`
3. Verify fees display for your children
4. Test "Pay Now" button (sandbox mode)

---

## 🎉 Success Criteria

You know migrations succeeded when:

- ✅ No SQL errors during execution
- ✅ All 7 tables exist in database
- ✅ All 6 functions are created
- ✅ Principal can create fees at `/dashboard/principal/fees`
- ✅ Parent can view fees at `/dashboard/parent/payments`
- ✅ System config shows `trial_days = 7`
- ✅ Existing schools have `status = 'trialing'`
- ✅ Grade 9 Math content is seeded

---

## 📞 Need Help?

1. Check Supabase logs for detailed error messages
2. Review individual migration files for dependencies
3. Verify your database user has CREATE permissions
4. Try running migrations one at a time to isolate issues
5. Check `FEE_MANAGEMENT_SETUP.md` for PayFast-specific help

---

## 🔗 Related Documentation

- `FEE_MANAGEMENT_SETUP.md` - Detailed fee management setup
- `FEE_MANAGEMENT_COMPLETE.md` - Implementation summary
- `COMPREHENSIVE_SYSTEM_AUDIT.md` - System health overview
- `.env.example` - Environment variable template

---

**Ready to proceed?** 🚀

Run the migrations and let's get your fee management system live!
