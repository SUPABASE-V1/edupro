# ⚡ Seed Content - Super Simple Method

## 🎯 Option 1: Supabase Dashboard (Easiest - 1 Minute)

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left menu
4. Click "New Query"

### Step 2: Copy & Paste This SQL

```sql
-- Insert past papers
INSERT INTO caps_documents (
  document_type, title, grade, subject, year, term,
  content_text, file_url, file_path, source_url, keywords
) VALUES
(
  'exam',
  'Grade 9 Mathematics November 2023',
  '9',
  'Mathematics',
  2023,
  4,
  'Grade 9 Mathematics Past Paper - November 2023. Sample questions on Algebra, Geometry, and Number Operations.',
  'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Nov2023.pdf',
  'caps/grade9/mathematics/2023/nov/exam.pdf',
  'https://www.education.gov.za/',
  ARRAY['algebra', 'geometry', 'mathematics', 'grade 9']
),
(
  'exam',
  'Grade 9 Mathematics June 2023',
  '9',
  'Mathematics',
  2023,
  2,
  'Grade 9 Mathematics Past Paper - June 2023. Mid-year examination.',
  'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Jun2023.pdf',
  'caps/grade9/mathematics/2023/jun/exam.pdf',
  'https://www.education.gov.za/',
  ARRAY['algebra', 'fractions', 'mathematics', 'grade 9']
),
(
  'exam',
  'Grade 9 Mathematics November 2022',
  '9',
  'Mathematics',
  2022,
  4,
  'Grade 9 Mathematics Past Paper - November 2022. End of year exam.',
  'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Nov2022.pdf',
  'caps/grade9/mathematics/2022/nov/exam.pdf',
  'https://www.education.gov.za/',
  ARRAY['percentage', 'geometry', 'mathematics', 'grade 9']
)
ON CONFLICT DO NOTHING;

-- Insert sample questions
INSERT INTO caps_exam_questions (
  question_number, question_text, marks, difficulty,
  grade, subject, topic, year, question_type,
  answer_text, marking_guideline
) VALUES
('1', 'Simplify: 3x + 2x - 5', 2, 'easy', '9', 'Mathematics', 'Algebra', 2023, 'short_answer', '5x - 5', 'Combine like terms'),
('2', 'Solve for x: 2x + 5 = 13', 3, 'medium', '9', 'Mathematics', 'Algebra', 2023, 'short_answer', 'x = 4', 'Subtract 5, then divide by 2'),
('3', 'Calculate area of triangle: base 8cm, height 5cm', 2, 'easy', '9', 'Mathematics', 'Geometry', 2023, 'calculation', '20 cm²', 'Area = (base × height) / 2'),
('4', 'Simplify: 12/18', 2, 'easy', '9', 'Mathematics', 'Fractions', 2023, 'short_answer', '2/3', 'Divide by GCD = 6'),
('5', 'Calculate 15% of R200', 2, 'easy', '9', 'Mathematics', 'Percentage', 2023, 'calculation', 'R30', '15% × 200 = 30')
ON CONFLICT DO NOTHING;

-- Verify results
SELECT 'Past Papers:' as status, COUNT(*) as count FROM caps_documents WHERE grade = '9' AND subject = 'Mathematics';
SELECT 'Questions:' as status, COUNT(*) as count FROM caps_exam_questions WHERE grade = '9' AND subject = 'Mathematics';
```

### Step 3: Click "Run"

You should see:
```
Past Papers: 3
Questions: 5
```

✅ **Done!** Content seeded.

---

## 🎯 Option 2: Install psql & Use Migration (5 Minutes)

### Install PostgreSQL Client:

**macOS**:
```bash
brew install postgresql@15
```

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

**Windows**:
Download from: https://www.postgresql.org/download/windows/

### Then run migration:

```bash
cd /workspace/migrations
export PGPASSWORD='your-password'
./run_single_migration.sh pending/03_seed_mvp_content.sql
```

---

## 🎯 Option 3: Install Dependencies & Use Script

```bash
# Install missing dependency
npm install dotenv

# Run script
node scripts/quick-mvp-content.js
```

---

## ✅ My Recommendation

**Use Option 1** (Supabase Dashboard) - it's instant!

1. Copy the SQL from above
2. Paste in Supabase SQL Editor
3. Click Run
4. Done in 30 seconds!

---

**After seeding, verify**:
```sql
SELECT * FROM caps_documents WHERE grade = '9' LIMIT 1;
SELECT * FROM caps_exam_questions WHERE grade = '9' LIMIT 1;
```

Should show data! ✅
