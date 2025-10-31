# 🚀 Complete Deployment Guide - Step by Step

**Last Updated**: 2024-10-31  
**Estimated Time**: 30-45 minutes

---

## 📋 Overview

This guide covers:
1. ✅ Code fixes (already done)
2. 🗄️ Database migrations (you need to run)
3. 🤖 Dash AI enhancement deployment
4. 🧪 Testing everything

---

## Part 1: Verify Code Fixes (Already Done)

### ✅ Fixed Files (No action needed - just verify):

1. **Brackets in Math Exams** - `web/src/components/dashboard/exam-prep/ExamInteractiveView.tsx`
2. **Hydration Error** - `web/src/app/dashboard/parent/payments/page.tsx`
3. **Build Errors** - `web/src/lib/supabase/server.ts` (created)
4. **Missing Icons** - `web/src/app/dashboard/principal/fees/page.tsx`
5. **Guest Rate Limit** - `web/src/lib/hooks/useGuestRateLimit.ts`

### Verify Build Works:
```bash
cd web
npm run build
```

**Expected**: ✅ Build succeeds with no errors

**If build fails**: Share the error and I'll fix it immediately.

---

## Part 2: Database Migrations (CRITICAL - Run These Now!)

### 🚨 IMPORTANT: Run migrations in EXACT order!

---

### Migration 1: Fix Students Table (REQUIRED FIRST!)

**File**: `migrations/pending/09_fix_students_parent_columns.sql`

**What it does**: Adds `parent_id` and `guardian_id` columns to students table

**Steps**:

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project
   - Go to: SQL Editor (left sidebar)

2. **Open the migration file locally**:
   ```bash
   cat migrations/pending/09_fix_students_parent_columns.sql
   ```

3. **Copy ALL contents** of that file

4. **Paste into Supabase SQL Editor**

5. **Click "Run"** (or press Ctrl+Enter)

6. **Verify Success**:
   - Look for: "Students table parent columns verified!" or similar success message
   - If you see errors, STOP and share the error

**Verification Query** (run this after):
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
  AND column_name IN ('parent_id', 'guardian_id');
```

**Expected Result**: 2 rows showing both columns exist

---

### Migration 2: Fee Management System

**File**: `migrations/pending/07_school_fee_management_system.sql`

**What it does**: Creates fee management tables and functions

**Steps**:

1. **In Supabase SQL Editor** (same place as before)

2. **Copy ALL contents** of:
   ```bash
   cat migrations/pending/07_school_fee_management_system.sql
   ```

3. **Paste into SQL Editor**

4. **Click "Run"**

5. **Verify Success**:
   - Look for: "School Fee Management System installed successfully!"
   - Should complete in 5-10 seconds

**Verification Query**:
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('school_fee_structures', 'student_fee_assignments', 'fee_payments');
```

**Expected Result**: 3 rows (all three tables exist)

---

### Migration 3: Invoice System (OPTIONAL but recommended)

**File**: `migrations/pending/08_invoice_management_system.sql`

**What it does**: Creates invoice tables and automation

**Steps**:

1. **In Supabase SQL Editor**

2. **Copy ALL contents** of:
   ```bash
   cat migrations/pending/08_invoice_management_system.sql
   ```

3. **Paste into SQL Editor**

4. **Click "Run"**

5. **Verify Success**:
   - Look for: "Invoice Management System installed successfully!"

**Verification Query**:
```sql
SELECT tablename FROM pg_tables 
WHERE tablename IN ('invoices', 'invoice_line_items', 'invoice_payments');
```

**Expected Result**: 3 rows (all three tables exist)

---

### Migration 4: Fix AI Logging (CRITICAL for Dash AI)

**What it does**: Makes `ai_service_id` nullable so AI usage can be logged

**Steps**:

1. **In Supabase SQL Editor**

2. **Copy and paste this SQL**:
```sql
-- Fix AI Usage Logging
ALTER TABLE public.ai_usage_logs 
ALTER COLUMN ai_service_id DROP NOT NULL;

-- Verify change
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'ai_usage_logs'
  AND column_name = 'ai_service_id';
```

3. **Click "Run"**

4. **Expected Result**: Shows `ai_service_id` with `is_nullable = YES`

---

### 📊 Migration Summary

After all migrations, you should have:
- ✅ Students table with `parent_id` and `guardian_id`
- ✅ 3 fee management tables
- ✅ 3 invoice tables
- ✅ AI logging table fixed

**Total time**: ~2-3 minutes

---

## Part 3: Deploy Dash AI Enhancements

### Step 1: Verify Edge Function File Updated

**Check that these changes are in**: `supabase/functions/ai-proxy/index.ts`

Run this to verify:
```bash
grep -n "buildEnhancedSystemPrompt" supabase/functions/ai-proxy/index.ts
```

**Expected**: Should show line numbers (around line 610)

**If not found**: The enhancement wasn't saved. Let me know.

---

### Step 2: Deploy Edge Function

```bash
cd supabase
supabase functions deploy ai-proxy
```

**Expected Output**:
```
Deploying function ai-proxy...
✓ Deployed function ai-proxy
```

**If you get errors**:
- "supabase command not found" → Install Supabase CLI:
  ```bash
  npm install -g supabase
  supabase login
  ```
- Other errors → Share the exact error

---

### Step 3: Verify Deployment

1. **Check Supabase Dashboard**:
   - Go to: Edge Functions (left sidebar)
   - Find: `ai-proxy`
   - Status should be: "Active" or "Deployed"

2. **Check Recent Logs**:
   - Click on `ai-proxy` function
   - Go to: Logs tab
   - Should see recent invocations

---

## Part 4: Testing Everything

### Test 1: Build Locally

```bash
cd web
npm run build
```

**Expected**: ✅ Successful build, no errors

---

### Test 2: Test Parent Fees Page

1. **Start dev server** (if not running):
   ```bash
   cd web
   npm run dev
   ```

2. **Navigate to**: `http://localhost:3000/dashboard/parent/payments`

3. **Expected**:
   - ✅ Page loads without errors
   - ✅ Shows "Outstanding Balance" (R0.00 if no fees)
   - ✅ Shows fee structure section
   - ❌ No console errors

4. **Check browser console** (F12 → Console):
   - Should see NO red errors
   - No "parent_id does not exist"
   - No "406 Not Acceptable"

---

### Test 3: Test Principal Fees Page

1. **Navigate to**: `http://localhost:3000/dashboard/principal/fees`

2. **Expected**:
   - ✅ Page loads
   - ✅ Shows summary cards (even if zeros)
   - ✅ "Create Default Fee Structure" button visible
   - ❌ No console errors

3. **Try creating default fees**:
   - Click "Create Default Fee Structure"
   - Should create 4 fees successfully

---

### Test 4: Test Math Exam Brackets

1. **Navigate to**: `http://localhost:3000/exam-prep`

2. **Generate a practice exam**:
   - Select: Grade 9, Mathematics
   - Click: Generate
   - Wait for exam to load

3. **Try typing math with brackets**:
   - In any numeric answer field, type: `(x+2)`
   - **Expected**: ✅ All characters appear (including brackets)
   - **Before fix**: Brackets would be stripped out

---

### Test 5: Test Dash AI Context

1. **Open Dash AI** (purple button in sidebar/menu)

2. **Test 1 - Context Awareness**:
   ```
   Type: "Who am I?"
   ```
   **Expected**: 
   ```
   "You're [Your Name], a [your role] at [Your School]"
   ```

3. **Test 2 - Tool Usage (if enabled)**:
   ```
   Type: "How many students do I have?"
   ```
   **Expected**: 
   - AI uses `query_database` tool
   - Returns actual count from database

4. **Test 3 - Multilingual**:
   ```
   Type: "Sawubona" (Zulu greeting)
   ```
   **Expected**:
   ```
   "Yebo! Unjani?" (natural Zulu response, no English)
   ```

5. **Test 4 - Exam Generation**:
   ```
   Type: "Generate a Grade 9 math practice test"
   ```
   **Expected**:
   - AI uses `generate_caps_exam` tool
   - Creates exam with COMPLETE questions (data included)
   - Example: "Calculate the common difference: 2, 5, 8, 11, 14"
   - NOT: "Calculate the common difference" (incomplete)

---

### Test 6: Check AI Logging

1. **After testing Dash AI**, go to Supabase Dashboard

2. **Go to**: Table Editor → `ai_usage_logs`

3. **Expected**:
   - ✅ New rows appear for your AI requests
   - ✅ No errors in logs
   - ✅ `status = 'success'`

4. **Before fix**: Would see 400 errors, no rows created

---

## Part 5: Troubleshooting

### Issue: Build Fails

**Error**: "Module not found"

**Fix**:
```bash
cd web
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Issue: Migration Fails

**Error**: "column already exists"

**Fix**: That's OK! Means it ran before. Skip to next migration.

**Error**: "permission denied"

**Fix**: Make sure you're using the correct Supabase project and have admin access.

**Error**: "relation does not exist"

**Fix**: Make sure you ran migrations in ORDER (09 → 07 → 08).

---

### Issue: Fees Page Shows Errors

**Error**: "column parent_id does not exist"

**Fix**: Run Migration 1 (09_fix_students_parent_columns.sql) again.

**Error**: "table school_fee_structures does not exist"

**Fix**: Run Migration 2 (07_school_fee_management_system.sql).

---

### Issue: Dash AI Not Working

**Error**: "quota_exceeded"

**Fix**: Check your subscription tier, may need to upgrade.

**Error**: AI responds but doesn't use tools

**Fix**: Make sure `enable_tools: true` is set in the AI request (check frontend code).

**Error**: AI logging returns 400

**Fix**: Run Migration 4 (AI logging fix SQL).

---

### Issue: Edge Function Deploy Fails

**Error**: "supabase: command not found"

**Fix**:
```bash
npm install -g supabase
supabase login
```

**Error**: "Project ref not found"

**Fix**: Link to your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

---

## Part 6: Verification Checklist

After completing all steps, verify:

### Code:
- [ ] `npm run build` succeeds with no errors
- [ ] No TypeScript errors
- [ ] All imports resolve correctly

### Database:
- [ ] Students table has `parent_id` and `guardian_id` columns
- [ ] Fee management tables exist (3 tables)
- [ ] Invoice tables exist (3 tables)
- [ ] AI logging table `ai_service_id` is nullable

### Fees System:
- [ ] Parent fees page loads without errors
- [ ] Principal fees page loads without errors
- [ ] Can create default fee structures
- [ ] No "parent_id" errors in console

### Dash AI:
- [ ] Edge function deployed successfully
- [ ] AI responds with context ("You're [name]...")
- [ ] AI uses tools (if enabled)
- [ ] AI creates complete exam questions
- [ ] Multilingual works naturally
- [ ] Usage logging works (rows in `ai_usage_logs`)

### UI:
- [ ] Math exams accept brackets: `(x+2)`, `[1,2]`
- [ ] Parent dashboard has hamburger menu (no bottom nav)
- [ ] Dash AI button visible (purple)
- [ ] No hydration errors in console

---

## Part 7: Quick Reference Commands

### Build & Test:
```bash
# Build
cd web && npm run build

# Run dev server
cd web && npm run dev

# Check for errors
cd web && npm run typecheck
```

### Database:
```bash
# All commands run in Supabase Dashboard SQL Editor

# 1. Check students table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

# 2. Check fee tables
SELECT tablename FROM pg_tables 
WHERE tablename LIKE '%fee%' OR tablename LIKE '%invoice%';

# 3. Test fee creation
SELECT create_default_fee_structures('your-preschool-id');

# 4. Check AI logging
SELECT * FROM ai_usage_logs ORDER BY created_at DESC LIMIT 5;
```

### Deployment:
```bash
# Deploy Edge Function
cd supabase && supabase functions deploy ai-proxy

# Check deployment
supabase functions list

# View logs
supabase functions logs ai-proxy
```

---

## Part 8: Success Criteria

### ✅ You're done when:

1. **Build**: `npm run build` succeeds
2. **Migrations**: All 4 migrations completed successfully
3. **Fees Pages**: Both parent and principal pages load without errors
4. **Dash AI**: 
   - Shows user context
   - Creates complete exam questions
   - Usage is logged
5. **Math Input**: Brackets work in exam answers
6. **No Errors**: Console is clean (no red errors)

---

## Part 9: Getting Help

### If something doesn't work:

1. **Check the specific error message** (exact text)
2. **Note which step failed** (build, migration, test, etc.)
3. **Share**:
   - The error message
   - Which browser/console tab you're on
   - What you were doing when it failed

### Common Questions:

**Q: Do I need to restart the dev server?**  
A: Yes, after migrations or code changes:
```bash
# Stop server (Ctrl+C)
# Restart
npm run dev
```

**Q: Can I skip some migrations?**  
A: NO! Must run in order: 09 → 07 → 08 → AI fix

**Q: What if I ran migrations out of order?**  
A: They might fail. Share the error and we'll fix it.

**Q: Do I need to redeploy after migrations?**  
A: No, migrations are database-only. But DO deploy the Edge Function.

**Q: How do I know if Edge Function deployed?**  
A: Check Supabase Dashboard → Edge Functions → ai-proxy should show "Active"

---

## Part 10: Timeline

**Total Time**: ~30-45 minutes

- Verify code fixes: 5 minutes
- Run migrations: 5 minutes
- Deploy Edge Function: 5 minutes
- Test everything: 15-30 minutes

---

## 🎉 Final Checklist

Before marking as complete:

- [ ] Build succeeds
- [ ] All 4 migrations run successfully
- [ ] Edge Function deployed
- [ ] Parent fees page works
- [ ] Principal fees page works
- [ ] Math brackets work
- [ ] Dash AI shows context
- [ ] Dash AI uses tools
- [ ] Exam questions are complete
- [ ] AI logging works (check table)
- [ ] No console errors

---

## 📞 Support

**If you get stuck at ANY step**:
1. Take a screenshot of the error
2. Share which step you're on
3. Copy/paste the exact error message

I'll help you immediately! 🚀

---

**Status**: Ready to start!  
**Next**: Begin with Part 2 (Database Migrations)  
**Good luck!** 🎯
