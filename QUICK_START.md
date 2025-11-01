# ⚡ Quick Start - Essential Steps Only

**Time**: 15 minutes  
**Complexity**: Easy

---

## Step 1: Run Database Migrations (REQUIRED!)

### Go to: https://supabase.com/dashboard
→ Your Project → SQL Editor

### Run these 4 SQL scripts in ORDER:

#### A. Fix Students Table (FIRST!)
```bash
# Copy contents of this file:
migrations/pending/09_fix_students_parent_columns.sql

# Paste in SQL Editor → Run
```

#### B. Fee Management
```bash
# Copy contents of this file:
migrations/pending/07_school_fee_management_system.sql

# Paste in SQL Editor → Run
```

#### C. Invoice System
```bash
# Copy contents of this file:
migrations/pending/08_invoice_management_system.sql

# Paste in SQL Editor → Run
```

#### D. AI Logging Fix
```sql
-- Paste this directly:
ALTER TABLE public.ai_usage_logs 
ALTER COLUMN ai_service_id DROP NOT NULL;
```

---

## Step 2: Deploy Dash AI Enhancement

```bash
cd supabase
supabase functions deploy ai-proxy
```

**Expected**: "✓ Deployed function ai-proxy"

---

## Step 3: Test

```bash
# 1. Build
cd web && npm run build
# Should succeed ✅

# 2. Run dev server
npm run dev

# 3. Test in browser:
# - Visit: /dashboard/parent/payments (should load)
# - Visit: /dashboard/principal/fees (should load)
# - Try Dash AI: Ask "Who am I?" (should know you)
# - Try math exam: Type "(x+2)" (should work)
```

---

## ✅ Done!

**If ANY step fails**: See `COMPLETE_DEPLOYMENT_GUIDE.md` for detailed troubleshooting.

---

## Quick Verification

Run these in Supabase SQL Editor to verify all migrations worked:

```sql
-- Check students table has new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('parent_id', 'guardian_id');
-- Should return 2 rows

-- Check fee tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN ('school_fee_structures', 'student_fee_assignments', 'fee_payments');
-- Should return 3 rows

-- Check invoice tables exist
SELECT tablename FROM pg_tables 
WHERE tablename IN ('invoices', 'invoice_line_items', 'invoice_payments');
-- Should return 3 rows

-- Check AI logging fixed
SELECT is_nullable FROM information_schema.columns 
WHERE table_name = 'ai_usage_logs' AND column_name = 'ai_service_id';
-- Should return 'YES'
```

All 4 queries pass? **You're done!** 🎉
