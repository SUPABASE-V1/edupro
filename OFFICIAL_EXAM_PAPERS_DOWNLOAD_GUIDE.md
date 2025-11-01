# 📥 Official DBE Past Exam Papers - Download Guide

## Overview
This guide helps you download **real, official** past examination papers from the South African Department of Basic Education (DBE) for integration into EduDash Pro.

## 🔗 Official Sources

### Primary Source
**Department of Basic Education** - National Senior Certificate (NSC) Examinations
- URL: https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/NSCPastExaminationpapers.aspx
- Contact: callcentre@dbe.gov.za | 0800 202 933

### Alternative Sources
- **Western Cape Education Portal**: https://wcedeportal.co.za/past-papers
- **Provincial Education Departments**: Each province maintains their own repository

## 📚 Papers to Download

### Grade 12 (Priority 1)
Download the most recent 3 years (2024, 2023, 2022) for:

#### Mathematics
- [ ] Mathematics Paper 1 (English)
- [ ] Mathematics Paper 1 Memorandum
- [ ] Mathematics Paper 2 (English)
- [ ] Mathematics Paper 2 Memorandum
- [ ] Mathematics Paper 1 (Afrikaans) - Optional
- [ ] Mathematics Paper 2 (Afrikaans) - Optional

#### Life Sciences
- [ ] Life Sciences Paper 1 (English)
- [ ] Life Sciences Paper 1 Memorandum
- [ ] Life Sciences Paper 2 (English)
- [ ] Life Sciences Paper 2 Memorandum

#### English Home Language
- [ ] English HL Paper 1 (Comprehension)
- [ ] English HL Paper 1 Memorandum
- [ ] English HL Paper 2 (Literature)
- [ ] English HL Paper 2 Memorandum

#### Afrikaans Huistaal
- [ ] Afrikaans HT Vraestel 1
- [ ] Afrikaans HT Memorandum 1
- [ ] Afrikaans HT Vraestel 2
- [ ] Afrikaans HT Memorandum 2

### Grade 10-11 (Priority 2)
Download 2024 June and November papers for:
- Mathematics
- Life Sciences
- English/Afrikaans

## 📁 File Organization

Save downloaded PDFs to:
```
exam-papers-official/
├── 2024/
│   ├── mathematics/
│   │   ├── Mathematics_P1_Nov2024_Eng.pdf
│   │   ├── Mathematics_P1_Nov2024_Memo.pdf
│   │   ├── Mathematics_P2_Nov2024_Eng.pdf
│   │   └── Mathematics_P2_Nov2024_Memo.pdf
│   ├── life-sciences/
│   │   ├── LifeSciences_P1_Nov2024_Eng.pdf
│   │   ├── LifeSciences_P1_Nov2024_Memo.pdf
│   │   ├── LifeSciences_P2_Nov2024_Eng.pdf
│   │   └── LifeSciences_P2_Nov2024_Memo.pdf
│   ├── english/
│   │   ├── English_HL_P1_Nov2024.pdf
│   │   ├── English_HL_P1_Nov2024_Memo.pdf
│   │   ├── English_HL_P2_Nov2024.pdf
│   │   └── English_HL_P2_Nov2024_Memo.pdf
│   └── afrikaans/
│       ├── Afrikaans_HT_V1_Nov2024.pdf
│       ├── Afrikaans_HT_V1_Nov2024_Memo.pdf
│       ├── Afrikaans_HT_V2_Nov2024.pdf
│       └── Afrikaans_HT_V2_Nov2024_Memo.pdf
├── 2023/
│   └── ... (same structure)
└── 2022/
    └── ... (same structure)
```

## 🚀 Quick Start

### Step 1: Run Download Helper
```bash
bash scripts/download-official-exam-papers.sh
```

This will:
- Create the directory structure
- Display download instructions
- List all required papers

### Step 2: Manual Download
1. Visit https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/NSCPastExaminationpapers.aspx
2. Navigate to the year (e.g., 2024 November NSC Examination Papers)
3. Download each paper and memorandum
4. Save to the correct folder structure above

### Step 3: Generate SQL Migration
```bash
node scripts/process-exam-papers.js
```

This creates: `migrations/pending/09_seed_official_exam_papers.sql`

### Step 4: Apply to Database
```bash
psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f migrations/pending/07_exam_papers_library.sql

psql -h aws-0-ap-southeast-1.pooler.supabase.com \
     -p 6543 \
     -U postgres.lvvvjywrmpcqrpvuptdi \
     -d postgres \
     -f migrations/pending/09_seed_official_exam_papers.sql
```

## 📋 Naming Conventions

Official DBE papers follow this naming pattern:
```
{Subject}_{PaperNumber}_{Month}{Year}_{Language}.pdf
{Subject}_{PaperNumber}_{Month}{Year}_Memo.pdf
```

Examples:
- `Mathematics_P1_Nov2024_Eng.pdf`
- `LifeSciences_P2_Nov2024_Memo.pdf`
- `English_HL_P1_Nov2024.pdf`
- `Afrikaans_HT_V1_Nov2024.pdf`

## 🔍 Verification

After downloading, verify:
- [ ] All papers have corresponding memorandums
- [ ] PDFs are readable and not corrupted
- [ ] File names match the pattern above
- [ ] Papers are correctly sorted by year and subject

## ⚖️ Legal & Copyright

**Important**: These are official government examination papers:
- Papers are publicly available from the DBE website
- Usage is for educational purposes within EduDash Pro
- Do not redistribute or sell papers separately
- Always attribute source as "Department of Basic Education, South Africa"

## 📊 Expected Papers Count

### Grade 12 (3 years × subjects × papers)
- Mathematics: 12 files (2 papers × 2 memo × 3 years)
- Life Sciences: 12 files
- English HL: 12 files
- Afrikaans HT: 12 files (optional)

**Total**: ~48-60 PDF files

## 🔧 Troubleshooting

### Papers Not Available
- **2024 Papers**: May not be released yet - use 2023 and 2022
- **Broken Links**: Contact DBE call center: 0800 202 933
- **Missing Memos**: Check supplementary materials section

### Download Issues
- **Large Files**: Papers are typically 2-5 MB each
- **Slow Downloads**: Try off-peak hours
- **Access Denied**: Some papers require registration

### Alternative Sources
If DBE website is down:
1. Western Cape ePortal: https://wcedeportal.co.za/past-papers
2. Provincial education departments
3. School resource portals (verify authenticity)

## 📞 Support

**DBE Call Centre**: 0800 202 933  
**Email**: callcentre@dbe.gov.za  
**Address**: 222 Struben Street, Pretoria

## ✅ Checklist

- [ ] Created `exam-papers-official/` directory
- [ ] Downloaded 2024 papers (or most recent available)
- [ ] Downloaded 2023 papers
- [ ] Downloaded 2022 papers
- [ ] Verified all PDFs are readable
- [ ] Organized files in correct structure
- [ ] Generated SQL migration
- [ ] Applied database migration
- [ ] Tested Dash AI can search papers

---

**Last Updated**: November 2, 2025  
**Next Review**: After applying migrations
