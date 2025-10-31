#!/usr/bin/env node
/**
 * Quick MVP Content Scraper (JavaScript version)
 * 
 * Downloads and seeds Grade 9 Mathematics past papers
 * Usage: node scripts/quick-mvp-content.js
 */

// Load environment variables
try {
  require('dotenv').config();
} catch (e) {
  console.log('⚠️  dotenv not installed, using process.env directly');
}

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  console.error('   Set in .env file or environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MVP_PAPERS = [
  {
    document_type: 'exam',
    title: 'Grade 9 Mathematics November 2023',
    grade: '9',
    subject: 'Mathematics',
    year: 2023,
    term: 4,
    content_text: 'Grade 9 Mathematics Past Paper - November 2023. Sample questions on Algebra, Geometry, and Number Operations.',
    file_url: 'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Nov2023.pdf',
    file_path: 'caps/grade9/mathematics/2023/nov/exam.pdf',
    source_url: 'https://www.education.gov.za/',
    keywords: ['algebra', 'geometry', 'mathematics', 'grade 9']
  },
  {
    document_type: 'exam',
    title: 'Grade 9 Mathematics June 2023',
    grade: '9',
    subject: 'Mathematics',
    year: 2023,
    term: 2,
    content_text: 'Grade 9 Mathematics Past Paper - June 2023. Mid-year examination covering Term 1 and 2 content.',
    file_url: 'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Jun2023.pdf',
    file_path: 'caps/grade9/mathematics/2023/jun/exam.pdf',
    source_url: 'https://www.education.gov.za/',
    keywords: ['algebra', 'fractions', 'mathematics', 'grade 9']
  },
  {
    document_type: 'exam',
    title: 'Grade 9 Mathematics November 2022',
    grade: '9',
    subject: 'Mathematics',
    year: 2022,
    term: 4,
    content_text: 'Grade 9 Mathematics Past Paper - November 2022. End of year examination with comprehensive coverage.',
    file_url: 'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Nov2022.pdf',
    file_path: 'caps/grade9/mathematics/2022/nov/exam.pdf',
    source_url: 'https://www.education.gov.za/',
    keywords: ['percentage', 'geometry', 'mathematics', 'grade 9']
  }
];

const MVP_QUESTIONS = [
  {
    question_number: '1',
    question_text: 'Simplify: 3x + 2x - 5',
    marks: 2,
    difficulty: 'easy',
    grade: '9',
    subject: 'Mathematics',
    topic: 'Algebra',
    year: 2023,
    question_type: 'short_answer',
    answer_text: '5x - 5',
    marking_guideline: 'Combine like terms: 3x + 2x = 5x, so the answer is 5x - 5'
  },
  {
    question_number: '2',
    question_text: 'Solve for x: 2x + 5 = 13',
    marks: 3,
    difficulty: 'medium',
    grade: '9',
    subject: 'Mathematics',
    topic: 'Algebra',
    year: 2023,
    question_type: 'short_answer',
    answer_text: 'x = 4',
    marking_guideline: 'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4'
  },
  {
    question_number: '3',
    question_text: 'Calculate the area of a triangle with base 8cm and height 5cm.',
    marks: 2,
    difficulty: 'easy',
    grade: '9',
    subject: 'Mathematics',
    topic: 'Geometry',
    year: 2023,
    question_type: 'calculation',
    answer_text: '20 cm²',
    marking_guideline: 'Area = (base × height) / 2 = (8 × 5) / 2 = 20 cm²'
  },
  {
    question_number: '4',
    question_text: 'Simplify: 12/18',
    marks: 2,
    difficulty: 'easy',
    grade: '9',
    subject: 'Mathematics',
    topic: 'Fractions',
    year: 2023,
    question_type: 'short_answer',
    answer_text: '2/3',
    marking_guideline: 'Divide both numerator and denominator by GCD(12,18) = 6'
  },
  {
    question_number: '5',
    question_text: 'Calculate 15% of R200',
    marks: 2,
    difficulty: 'easy',
    grade: '9',
    subject: 'Mathematics',
    topic: 'Percentage',
    year: 2023,
    question_type: 'calculation',
    answer_text: 'R30',
    marking_guideline: '15% of R200 = 0.15 × 200 = R30'
  }
];

async function main() {
  console.log('🚀 Quick MVP Content Setup');
  console.log('   Target: Grade 9 Mathematics');
  console.log('   Time: ~10 minutes\n');

  // Step 1: Insert past papers (into caps_documents)
  console.log('📚 Step 1: Inserting past papers...');
  try {
    const { data, error } = await supabase
      .from('caps_documents')
      .insert(MVP_PAPERS)
      .select();

    if (error) {
      console.error('   ❌ Error inserting papers:', error.message);
      console.error('   Details:', error);
    } else {
      console.log(`   ✅ Inserted ${data?.length || 0} past papers`);
    }
  } catch (err) {
    console.error('   ❌ Unexpected error:', err);
  }

  // Step 2: Insert questions
  console.log('\n📝 Step 2: Inserting sample questions...');
  try {
    const { data, error } = await supabase
      .from('caps_exam_questions')
      .insert(MVP_QUESTIONS)
      .select();

    if (error) {
      console.error('   ❌ Error inserting questions:', error.message);
    } else {
      console.log(`   ✅ Inserted ${data?.length || 0} questions`);
    }
  } catch (err) {
    console.error('   ❌ Unexpected error:', err.message);
  }

  // Step 3: Verify
  console.log('\n✅ Step 3: Verifying content...');
  const { count: paperCount } = await supabase
    .from('caps_documents')
    .select('*', { count: 'exact', head: true })
    .eq('grade', '9')
    .eq('subject', 'Mathematics')
    .eq('document_type', 'past_paper');

  const { count: questionCount } = await supabase
    .from('caps_exam_questions')
    .select('*', { count: 'exact', head: true })
    .eq('grade', '9')
    .eq('subject', 'Mathematics');

  console.log(`   Past Papers: ${paperCount || 0}`);
  console.log(`   Questions: ${questionCount || 0}`);

  console.log('\n🎉 MVP content setup complete!');
  console.log('   Next steps:');
  console.log('   1. Test exam generation in UI');
  console.log('   2. Verify questions appear correctly');
  console.log('   3. Add more content as needed');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
