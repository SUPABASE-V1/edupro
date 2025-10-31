# 🚀 DBE Content Scraping - Quick Start Guide

## Prerequisites

1. **Install Dependencies**:
```bash
npm install
# or
yarn install
```

2. **Configure Supabase** (if not already done):
```bash
# Copy .env.example to .env
cp .env.example .env

# Add your Supabase credentials:
# SUPABASE_URL=your-url
# SUPABASE_ANON_KEY=your-key
```

---

## Step 1: Scrape DBE URLs (10 minutes)

```bash
# Extract current CAPS document URLs from DBE website
npx ts-node scripts/scrape-caps-urls.ts

# Output: caps-urls.json with ~100 URLs
```

**Expected Output**:
```json
{
  "foundation_phase": [
    {
      "grade": "Grade 1",
      "subject": "Mathematics",
      "url": "https://www.education.gov.za/...",
      "year": 2024
    }
  ]
}
```

---

## Step 2: Download CAPS Documents (2-3 hours)

```bash
# Download PDFs from DBE website
npx ts-node scripts/download-caps-curriculum.ts

# This will:
# 1. Download ~500 PDF files (slow!)
# 2. Store in ./data/caps-documents/
# 3. Insert metadata into Supabase
```

**⚠️ Warning**: 
- This takes 2-3 hours (rate-limited to be nice to DBE servers)
- Downloads ~2GB of PDFs
- Ensure stable internet connection

**Options**:
```bash
# Download specific grade only
npx ts-node scripts/download-caps-curriculum.ts --grade 9

# Download specific subject only
npx ts-node scripts/download-caps-curriculum.ts --subject Mathematics

# Dry run (don't actually download)
npx ts-node scripts/download-caps-curriculum.ts --dry-run
```

---

## Step 3: Parse PDFs into Questions (4-8 hours)

```bash
# Parse first 50 papers for MVP
npx ts-node scripts/parse-exam-papers.ts --limit 50

# This will:
# 1. OCR PDF pages
# 2. Extract questions using AI
# 3. Insert into caps_exam_questions table
```

**Note**: This uses Claude AI for parsing (costs ~$2 for 50 papers)

---

## Quick MVP Setup (2 hours)

If you need content ASAP for testing:

```bash
# Run all steps for Grade 9 Mathematics only
npx ts-node scripts/quick-mvp-content.ts

# This downloads and parses just Grade 9 Math:
# - ~20 past papers
# - ~200 questions
# - Ready in 2 hours
```

---

## Database Verification

After scraping, verify content:

```sql
-- Check past papers
SELECT grade, subject, COUNT(*) 
FROM caps_past_papers 
GROUP BY grade, subject 
ORDER BY grade, subject;

-- Check questions
SELECT grade, subject, COUNT(*) 
FROM caps_exam_questions 
GROUP BY grade, subject 
ORDER BY grade, subject;

-- Check curriculum docs
SELECT phase, COUNT(*) 
FROM caps_curriculum_documents 
GROUP BY phase;
```

---

## Troubleshooting

### "Permission denied" error
```bash
chmod +x scripts/*.ts
```

### "Module not found" error
```bash
npm install @supabase/supabase-js pdf-parse dotenv
```

### DBE website blocking requests
- Script already includes rate limiting (2 second delay between requests)
- If blocked, wait 1 hour and retry
- Consider running overnight

### PDF parsing errors
- Some old PDFs may have poor OCR quality
- Script logs errors to `./logs/parsing-errors.log`
- Manual review may be needed

---

## Manual Alternatives

If automated scraping fails, you can manually:

1. **Download from DBE**:
   - Visit: https://www.education.gov.za/Curriculum/NationalCurriculumStatementsGradesR-12.aspx
   - Download past papers manually
   - Place in `./data/caps-documents/`

2. **Upload to Dashboard**:
   ```sql
   -- Manual insert
   INSERT INTO caps_past_papers (title, grade, subject, year, pdf_url, source)
   VALUES ('Grade 9 Math November 2023', '9', 'Mathematics', 2023, 
           'https://...', 'dbe_official');
   ```

---

## Progress Tracking

Monitor scraping progress:

```bash
# Watch logs
tail -f logs/content-scraping.log

# Check database progress
psql $DATABASE_URL -c "SELECT COUNT(*) FROM caps_past_papers;"
```

---

## Next Steps After Scraping

1. **Verify Quality**: Spot-check 10 random questions for accuracy
2. **Add Images**: Run image extraction script
3. **Enable in UI**: Update exam generation to query database
4. **Monitor Usage**: Track which content gets used most

---

## Estimated Costs

| Task | Time | Cost |
|------|------|------|
| URL Scraping | 10 min | Free |
| PDF Download | 3 hours | Free (bandwidth only) |
| PDF Parsing (50 papers) | 4 hours | $2 (Claude API) |
| PDF Parsing (500 papers) | 40 hours | $20 (Claude API) |
| Storage (2GB PDFs) | - | $0.10/month |

---

## 🎯 Recommended for 2-Day Sprint

**Option 1: Quick MVP (2 hours)**
```bash
npx ts-node scripts/quick-mvp-content.ts
```
- Grade 9 Mathematics only
- 20 papers, 200 questions
- Good enough for demo

**Option 2: Full Grade 9-12 (overnight)**
```bash
npx ts-node scripts/download-caps-curriculum.ts --grades "9,10,11,12"
```
- Run overnight
- ~200 papers
- ~5,000 questions
- Ready by morning

---

**Questions?** Check `scripts/README.md` or contact dev team.
