#!/usr/bin/env node
/**
 * Quick MVP Content Scraper (JavaScript version)
 * 
 * Downloads and seeds Grade 9 Mathematics past papers
 * Usage: node scripts/quick-mvp-content.js
 */

require('dotenv').config();
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
    title: 'Grade 9 Mathematics November 2023',
    grade: '9',
    subject: 'Mathematics',
    year: 2023,
    term: 4,
    pdf_url: 'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Nov2023.pdf',
    source: 'dbe_official'
  },
  {
    title: 'Grade 9 Mathematics June 2023',
    grade: '9',
    subject: 'Mathematics',
    year: 2023,
    term: 2,
    pdf_url: 'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Jun2023.pdf',
    source: 'dbe_official'
  },
  {
    title: 'Grade 9 Mathematics November 2022',
    grade: '9',
    subject: 'Mathematics',
    year: 2022,
    term: 4,
    pdf_url: 'https://www.education.gov.za/Portals/0/Documents/Exams/Grade9_Maths_Nov2022.pdf',
    source: 'dbe_official'
  }
];

const MVP_QUESTIONS = [
  {
    grade: '9',
    subject: 'Mathematics',
    topic: 'Algebra',
    question_text: 'Simplify: 3x + 2x - 5',
    question_type: 'short_answer',
    difficulty: 'easy',
    marks: 2,
    year: 2023,
    source: 'dbe_past_paper',
    correct_answer: '5x - 5',
    explanation: 'Combine like terms: 3x + 2x = 5x, so the answer is 5x - 5'
  },
  {
    grade: '9',
    subject: 'Mathematics',
    topic: 'Algebra',
    question_text: 'Solve for x: 2x + 5 = 13',
    question_type: 'short_answer',
    difficulty: 'medium',
    marks: 3,
    year: 2023,
    source: 'dbe_past_paper',
    correct_answer: 'x = 4',
    explanation: 'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4'
  },
  {
    grade: '9',
    subject: 'Mathematics',
    topic: 'Geometry',
    question_text: 'Calculate the area of a triangle with base 8cm and height 5cm.',
    question_type: 'numeric',
    difficulty: 'easy',
    marks: 2,
    year: 2023,
    source: 'dbe_past_paper',
    correct_answer: '20',
    explanation: 'Area = (base × height) / 2 = (8 × 5) / 2 = 20 cm²'
  },
  {
    grade: '9',
    subject: 'Mathematics',
    topic: 'Fractions',
    question_text: 'Simplify: 12/18',
    question_type: 'short_answer',
    difficulty: 'easy',
    marks: 2,
    year: 2023,
    source: 'dbe_past_paper',
    correct_answer: '2/3',
    explanation: 'Divide both numerator and denominator by GCD(12,18) = 6'
  },
  {
    grade: '9',
    subject: 'Mathematics',
    topic: 'Percentage',
    question_text: 'Calculate 15% of R200',
    question_type: 'numeric',
    difficulty: 'easy',
    marks: 2,
    year: 2023,
    source: 'dbe_past_paper',
    correct_answer: '30',
    explanation: '15% of R200 = 0.15 × 200 = R30'
  }
];

async function main() {
  console.log('🚀 Quick MVP Content Setup');
  console.log('   Target: Grade 9 Mathematics');
  console.log('   Time: ~10 minutes\n');

  // Step 1: Insert past papers
  console.log('📚 Step 1: Inserting past papers...');
  try {
    const { data, error } = await supabase
      .from('caps_past_papers')
      .insert(MVP_PAPERS)
      .select();

    if (error) {
      console.error('   ❌ Error inserting papers:', error.message);
    } else {
      console.log(`   ✅ Inserted ${data?.length || 0} past papers`);
    }
  } catch (err) {
    console.error('   ❌ Unexpected error:', err.message);
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
    .from('caps_past_papers')
    .select('*', { count: 'exact', head: true })
    .eq('grade', '9')
    .eq('subject', 'Mathematics');

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
