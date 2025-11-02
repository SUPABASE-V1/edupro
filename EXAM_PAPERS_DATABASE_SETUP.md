# ✅ Exam Papers Database - Complete Setup

## Status: FULLY DEPLOYED

### What Was Accomplished

1. **Database Schema Created** ✅
   - `exam_papers` table with full-text search
   - `exam_attempts` table for student tracking
   - Full CAPS curriculum alignment
   - Multi-language support (en-ZA, af-ZA, zu-ZA, xh-ZA)
   - RLS policies for security

2. **Official Exam Paper Metadata Seeded** ✅
   - 8 official DBE papers registered in database
   - Years: 2024, 2023
   - Subjects: Mathematics, Life Sciences, English, Afrikaans
   - All Grade 12 NSC papers

3. **Search Functionality Ready** ✅
   - Full-text search with `search_exam_papers()` function
   - Filter by subject, grade, year
   - Topic-based search using GIN indexes

## Database Tables

### `exam_papers`
```sql
Current papers in database:
┌───────────────────────────────────────────────┬───────────────────────┬──────────┬──────┬──────────┬─────────────┐
│ Title                                         │ Subject               │ Grade    │ Year │ Language │ Topic Count │
├───────────────────────────────────────────────┼───────────────────────┼──────────┼──────┼──────────┼─────────────┤
│ Afrikaans Huistaal Vraestel 1 - November 2024│ Afrikaans Huistaal    │ Grade 12 │ 2024 │ af-ZA    │           3 │
│ English Home Language Paper 1 - November 2024 │ English Home Language │ Grade 12 │ 2024 │ en-ZA    │           3 │
│ Life Sciences Paper 1 - November 2024         │ Life Sciences         │ Grade 12 │ 2024 │ en-ZA    │           5 │
│ Life Sciences Paper 2 - November 2024         │ Life Sciences         │ Grade 12 │ 2024 │ en-ZA    │           5 │
│ Mathematics Paper 1 - November 2024           │ Mathematics           │ Grade 12 │ 2024 │ en-ZA    │           4 │
│ Mathematics Paper 2 - November 2024           │ Mathematics           │ Grade 12 │ 2024 │ en-ZA    │           5 │
│ Life Sciences Paper 1 - November 2023         │ Life Sciences         │ Grade 12 │ 2023 │ en-ZA    │           4 │
│ Mathematics Paper 1 - November 2023           │ Mathematics           │ Grade 12 │ 2024 │ en-ZA    │           4 │
└───────────────────────────────────────────────┴───────────────────────┴──────────┴──────┴──────────┴─────────────┘
```

### Features Available

#### Search Function
```sql
-- Search for exam papers
SELECT * FROM search_exam_papers(
  'photosynthesis',           -- search query
  'Life Sciences',            -- subject filter (optional)
  'Grade 12',                 -- grade filter (optional)
  2024                        -- year filter (optional)
);
```

#### Student Attempts Tracking
- Track when students attempt papers
- Store answers and scoring
- Get AI feedback from Dash
- Identify strengths and weaknesses

## Next Steps

### Phase 1: Download Official Papers (MANUAL TASK)
📥 **Download real PDFs from DBE website**

Follow instructions in: [`OFFICIAL_EXAM_PAPERS_DOWNLOAD_GUIDE.md`](./OFFICIAL_EXAM_PAPERS_DOWNLOAD_GUIDE.md)

Required downloads:
- [ ] 2024 Mathematics P1 & P2 (English) + Memos
- [ ] 2024 Life Sciences P1 & P2 (English) + Memos
- [ ] 2024 English HL P1 & P2 + Memos
- [ ] 2024 Afrikaans HT V1 & V2 + Memos
- [ ] 2023 papers (same subjects)
- [ ] 2022 papers (optional)

**Download URL**: https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/NSCPastExaminationpapers.aspx

Save to: `exam-papers-official/{year}/{subject}/`

### Phase 2: Connect Dash AI to Database
Update `ai-proxy-simple` edge function to search exam papers:

```typescript
// Add tool definition
const tools = [
  {
    name: 'search_exam_papers',
    description: 'Search for past exam papers by subject, grade, year, or topic',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (e.g., "photosynthesis", "calculus")' },
        subject: { type: 'string', description: 'Subject filter (e.g., "Mathematics", "Life Sciences")' },
        grade: { type: 'string', description: 'Grade filter (e.g., "Grade 12")' },
        year: { type: 'integer', description: 'Year filter (e.g., 2024)' }
      }
    }
  }
];

// Call Supabase function
const { data } = await supabase.rpc('search_exam_papers', {
  search_query: toolInput.query,
  filter_subject: toolInput.subject,
  filter_grade: toolInput.grade,
  filter_year: toolInput.year
});
```

### Phase 3: Test Dash AI Exam Paper Search
Test queries:
- "Find me Grade 12 Math papers from 2024"
- "Show me Life Sciences papers about genetics"
- "I need past papers for English comprehension"
- "Afrikaans Huistaal vraestelle"

## Files Created

1. **Migrations**
   - `migrations/pending/07_exam_papers_library.sql` - Database schema
   - `migrations/pending/09_seed_official_exam_papers.sql` - Official paper metadata

2. **Scripts**
   - `scripts/download-official-exam-papers.sh` - Download helper
   - `scripts/process-exam-papers.js` - Generate SQL from metadata

3. **Documentation**
   - `OFFICIAL_EXAM_PAPERS_DOWNLOAD_GUIDE.md` - Download instructions
   - `EXAM_PAPERS_DATABASE_SETUP.md` - This file
   - `DASH_AI_INTEGRATION_STATUS.md` - Overall Dash AI status

## Database Connection Details

**Host**: aws-0-ap-southeast-1.pooler.supabase.com  
**Port**: 6543  
**User**: postgres.lvvvjywrmpcqrpvuptdi  
**Database**: postgres

**Connect with**:
```bash
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres
```

## Verification Queries

### Check Papers Count
```sql
SELECT 
  subject,
  COUNT(*) as paper_count,
  array_agg(DISTINCT year ORDER BY year DESC) as years
FROM exam_papers
GROUP BY subject;
```

### Test Search Function
```sql
-- Search for "calculus" in Mathematics
SELECT title, subject, grade, year, topics
FROM search_exam_papers('calculus', 'Mathematics', NULL, NULL)
LIMIT 5;
```

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('exam_papers', 'exam_attempts');
```

## Security & Access

### RLS Policies Applied
- ✅ **exam_papers**: Anyone (authenticated) can read, only admins can manage
- ✅ **exam_attempts**: Users can CRUD own attempts, parents can view children's

### Roles with Management Access
- `super_admin`
- `admin`
- `principal`

## Performance Optimization

### Indexes Created
- Subject index (B-tree)
- Grade index (B-tree)
- Year index (B-tree)
- Topics index (GIN array)
- Full-text search index (GIN tsvector)
- Composite year+subject index
- Composite grade+year index

### Search Vector Updates
Automatic trigger on INSERT/UPDATE to maintain full-text search index.

## API Usage for Dash AI

### Search Papers
```javascript
const { data, error } = await supabase.rpc('search_exam_papers', {
  search_query: 'photosynthesis',
  filter_subject: 'Life Sciences',
  filter_grade: 'Grade 12',
  filter_year: 2024
});
```

### Record Student Attempt
```javascript
const { data, error } = await supabase
  .from('exam_attempts')
  .insert({
    user_id: userId,
    student_id: studentId,
    exam_paper_id: paperId,
    answers: { /* student answers */ },
    total_marks: 150
  });
```

### Calculate Score
```javascript
const { data, error } = await supabase.rpc('calculate_exam_score', {
  attempt_id: attemptId
});
```

## Support & Troubleshooting

### Common Issues

**Issue**: "Column does not exist"  
**Solution**: Schema was updated, rerun migration 07

**Issue**: "Papers not showing"  
**Solution**: Check RLS policies, ensure user is authenticated

**Issue**: "Search not working"  
**Solution**: Verify search_vector trigger is active

### Get Help
Check logs:
```sql
SELECT * FROM exam_papers LIMIT 5;
SELECT * FROM exam_attempts LIMIT 5;
```

## Success Metrics

- ✅ 8 official exam papers in database
- ✅ Full-text search operational
- ✅ Multi-language support (en-ZA, af-ZA)
- ✅ RLS security enabled
- ✅ Performance indexes created
- ⏳ PDF files (manual download required)
- ⏳ Dash AI tool integration (next step)

---

**Status**: Database ready, awaiting PDF downloads  
**Last Updated**: November 2, 2025  
**Next Action**: Download official papers from DBE website
