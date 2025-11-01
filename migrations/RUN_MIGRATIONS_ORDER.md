# 🚀 Database Migrations - CORRECT ORDER

## ⚠️ IMPORTANT: Run in This Order!

You got the error because migrations need to be run in sequence. Here's the correct order:

---

## 📋 Migration Order

### **1. Guest Mode Rate Limiting** ✅
**File**: `migrations/pending/01_guest_mode_rate_limiting.sql`

**Creates**: 
- `guest_usage_log` table
- `check_guest_limit()` function
- `log_guest_usage()` function

**Run first**: ✅ (No dependencies)

---

### **2. Fix Trial Period** ✅
**File**: `migrations/pending/02_fix_trial_period_to_7_days.sql`

**Updates**:
- `create_trial_subscription()` function (7-day trial)

**Run second**: ✅ (No dependencies)

---

### **3. Exam Prep Tables** ⚠️ **MUST RUN BEFORE #4!**
**File**: `supabase/migrations/20251030141353_add_exam_prep_tables.sql`

**Creates**:
- `exam_generations` table ← **REQUIRED FOR ASSIGNMENTS!**
- `exam_user_progress` table

**Run third**: ⚠️ **THIS WAS MISSING!**

---

### **4. Exam Assignments System**
**File**: `migrations/pending/04_exam_assignments_system.sql`

**Creates**:
- `exam_assignments` table (depends on `exam_generations`)
- `exam_submissions` table

**Run fourth**: After migration #3

---

### **5. Seed MVP Content**
**File**: `migrations/pending/03_seed_mvp_content.sql`

**Inserts**:
- Grade 9 Math past papers
- Sample exam questions

**Run last**: ✅ (Optional, for testing)

---

## 🛠️ How to Run (Choose One Method)

### **Method 1: Supabase Dashboard** (Easiest)

1. Go to: https://supabase.com/dashboard → SQL Editor
2. Copy/paste each file in order
3. Click "Run"

### **Method 2: psql Command Line**

```bash
# Set connection string
DB="psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -U postgres.lvvvjywrmpcqrpvuptdi -d postgres"

# 1. Guest mode
$DB -f migrations/pending/01_guest_mode_rate_limiting.sql

# 2. Trial period
$DB -f migrations/pending/02_fix_trial_period_to_7_days.sql

# 3. Exam prep tables (THE MISSING ONE!)
$DB -f supabase/migrations/20251030141353_add_exam_prep_tables.sql

# 4. Exam assignments
$DB -f migrations/pending/04_exam_assignments_system.sql

# 5. Seed content (optional)
$DB -f migrations/pending/03_seed_mvp_content.sql
```

---

## 🔍 Your Specific Error

### Error Message:
```
ERROR: 42P01: relation "public.exam_generations" does not exist
```

### Root Cause:
Migration **#3** (`20251030141353_add_exam_prep_tables.sql`) was never run!

### Solution:
Run migration #3 BEFORE migration #4.

---

## ✅ Quick Fix (Copy This to SQL Editor)

**Step 1**: Run this first to create `exam_generations`:

```sql
-- From: supabase/migrations/20251030141353_add_exam_prep_tables.sql
CREATE TABLE IF NOT EXISTS public.exam_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN (
    'practice_test', 'revision_notes', 'study_guide', 'flashcards'
  )),
  prompt TEXT,
  generated_content TEXT,
  display_title TEXT,
  metadata JSONB DEFAULT '{}',
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_generations_user ON public.exam_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_generations_created ON public.exam_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_generations_type ON public.exam_generations(exam_type);

ALTER TABLE public.exam_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exam generations"
  ON public.exam_generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create exam generations"
  ON public.exam_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their exam generations"
  ON public.exam_generations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their exam generations"
  ON public.exam_generations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Also create exam_user_progress
CREATE TABLE IF NOT EXISTS public.exam_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_generation_id UUID REFERENCES public.exam_generations(id) ON DELETE SET NULL,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  answers JSONB DEFAULT '{}',
  score DECIMAL(5,2),
  time_spent_seconds INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_progress_user ON public.exam_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_progress_exam ON public.exam_user_progress(exam_generation_id);

ALTER TABLE public.exam_user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON public.exam_user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create progress"
  ON public.exam_user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their progress"
  ON public.exam_user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Step 2**: Now run the exam assignments migration:

```sql
-- From: migrations/pending/04_exam_assignments_system.sql
-- (paste full contents here)
```

---

## 📊 Verification Query

After running all migrations, verify:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'exam_generations',
  'exam_assignments',
  'exam_submissions',
  'guest_usage_log'
)
ORDER BY table_name;

-- Should return 4 rows
```

---

## 🎯 Summary

**Problem**: Tried to run migration #4 before #3
**Solution**: Run migrations in order (1 → 2 → 3 → 4 → 5)
**Quick Fix**: Run the SQL above in your dashboard

---

## ✅ Next Steps

1. ✅ Run migration #3 (exam_generations)
2. ✅ Then run migration #4 (exam_assignments)
3. ✅ Restart dev server
4. ✅ Test teacher assignment flow

Ready to go! 🚀
