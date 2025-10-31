# ⚡ Quick Fixes Applied

## ✅ Issue 1: Module Not Found - FIXED

**Error**: `Cannot find module '@/lib/supabase'`

**Fix**: Updated import path in `ExamPrepWidget.tsx`

```typescript
// BEFORE (wrong)
const { assertSupabase } = await import('@/lib/supabase');

// AFTER (correct)
const { createClient } = await import('@/lib/supabase/client');
const supabase = createClient();
```

**Status**: ✅ Fixed - Restart your dev server

---

## ⚡ Issue 2: TypeScript Execution - FIXED

**Error**: `Unknown file extension ".ts"`

### Solution A: Use npx tsx (Recommended)

```bash
# Install tsx (fast TypeScript runner)
npm install -D tsx

# Run script
npx tsx scripts/quick-mvp-content.ts
```

### Solution B: Use Node directly (JS version)

```bash
# I'll create a JS version for you
node scripts/quick-mvp-content.js
```

### Solution C: Use the shell script

```bash
./scripts/run-quick-mvp.sh
```

---

## 🚀 Next Steps

### 1. Restart Dev Server (Fix Module Error)

```bash
# Stop current server (Ctrl+C)
cd web
npm run dev
```

### 2. Run Content Script

Pick ONE method:

**Method 1 - tsx** (fastest):
```bash
npm install -D tsx
npx tsx scripts/quick-mvp-content.ts
```

**Method 2 - Compiled JS** (I'll create this now):
```bash
node scripts/quick-mvp-content.js
```

**Method 3 - Direct SQL** (manual):
See below ↓

---

## 📊 Manual Content Seeding (If Scripts Fail)

Run this SQL directly in Supabase:

```sql
-- Insert past papers
INSERT INTO caps_past_papers (title, grade, subject, year, term, pdf_url, source) VALUES
('Grade 9 Mathematics November 2023', '9', 'Mathematics', 2023, 4, 
 'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Nov2023.pdf', 
 'dbe_official'),
('Grade 9 Mathematics June 2023', '9', 'Mathematics', 2023, 2, 
 'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Jun2023.pdf', 
 'dbe_official'),
('Grade 9 Mathematics November 2022', '9', 'Mathematics', 2022, 4, 
 'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Nov2022.pdf', 
 'dbe_official');

-- Insert sample questions
INSERT INTO caps_exam_questions (grade, subject, topic, question_text, question_type, difficulty, marks, year, source, correct_answer, explanation) VALUES
('9', 'Mathematics', 'Algebra', 'Simplify: 3x + 2x - 5', 'short_answer', 'easy', 2, 2023, 'dbe_past_paper', '5x - 5', 'Combine like terms: 3x + 2x = 5x'),
('9', 'Mathematics', 'Algebra', 'Solve for x: 2x + 5 = 13', 'short_answer', 'medium', 3, 2023, 'dbe_past_paper', 'x = 4', 'Subtract 5 from both sides: 2x = 8, then divide by 2'),
('9', 'Mathematics', 'Geometry', 'Calculate the area of a triangle with base 8cm and height 5cm', 'numeric', 'easy', 2, 2023, 'dbe_past_paper', '20', 'Area = (base × height) / 2 = 20 cm²'),
('9', 'Mathematics', 'Fractions', 'Simplify: 12/18', 'short_answer', 'easy', 2, 2023, 'dbe_past_paper', '2/3', 'Divide by GCD(12,18) = 6'),
('9', 'Mathematics', 'Percentage', 'Calculate 15% of R200', 'numeric', 'easy', 2, 2023, 'dbe_past_paper', '30', '15% of R200 = 0.15 × 200 = R30');

-- Verify
SELECT COUNT(*) FROM caps_past_papers;
SELECT COUNT(*) FROM caps_exam_questions;
```

---

## ✅ Verification

After fixes, test:

1. **Module fix**: Visit `http://localhost:3000/exam-prep`
   - Should load without console errors ✅

2. **Content**: Check database
   ```sql
   SELECT * FROM caps_past_papers LIMIT 1;
   ```
   - Should show 3 papers ✅

---

## 🔄 If Still Having Issues

### Dev Server Not Restarting?

```bash
# Kill all node processes
killall node

# Restart
cd web
npm run dev
```

### Module Still Not Found?

```bash
# Clear Next.js cache
cd web
rm -rf .next
npm run dev
```

### TypeScript Still Failing?

Use the manual SQL method above (safest) ✅

---

## 📞 Quick Status Check

Run these to verify everything:

```bash
# 1. Check module exists
ls web/src/lib/supabase/client.ts

# 2. Check migrations ran
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -c "SELECT COUNT(*) FROM guest_usage_log;"

# 3. Check dev server
curl http://localhost:3000/exam-prep
```

All working? ✅ Move to next phase!

---

**Current Status**: 
- ✅ Migrations done
- ⚡ Module import fixed
- 🔄 Content seeding (in progress)

**Next**: Seed content, then test features!
