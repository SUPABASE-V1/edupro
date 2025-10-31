-- Seed MVP Content - Grade 9 Mathematics
-- Adds sample past papers and questions for testing

-- Insert past papers into caps_documents
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
  'Grade 9 Mathematics Past Paper - June 2023. Mid-year examination covering Term 1 and 2 content.',
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
  'Grade 9 Mathematics Past Paper - November 2022. End of year examination with comprehensive coverage.',
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
(
  '1',
  'Simplify: 3x + 2x - 5',
  2,
  'easy',
  '9',
  'Mathematics',
  'Algebra',
  2023,
  'short_answer',
  '5x - 5',
  'Combine like terms: 3x + 2x = 5x, so the answer is 5x - 5'
),
(
  '2',
  'Solve for x: 2x + 5 = 13',
  3,
  'medium',
  '9',
  'Mathematics',
  'Algebra',
  2023,
  'short_answer',
  'x = 4',
  'Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4'
),
(
  '3',
  'Calculate the area of a triangle with base 8cm and height 5cm.',
  2,
  'easy',
  '9',
  'Mathematics',
  'Geometry',
  2023,
  'calculation',
  '20 cm²',
  'Area = (base × height) / 2 = (8 × 5) / 2 = 20 cm²'
),
(
  '4',
  'Simplify: 12/18',
  2,
  'easy',
  '9',
  'Mathematics',
  'Fractions',
  2023,
  'short_answer',
  '2/3',
  'Divide both numerator and denominator by GCD(12,18) = 6'
),
(
  '5',
  'Calculate 15% of R200',
  2,
  'easy',
  '9',
  'Mathematics',
  'Percentage',
  2023,
  'calculation',
  'R30',
  '15% of R200 = 0.15 × 200 = R30'
)
ON CONFLICT DO NOTHING;

-- Verify
SELECT 'Past Papers Inserted:' as status, COUNT(*) as count 
FROM caps_documents 
WHERE grade = '9' AND subject = 'Mathematics' AND document_type = 'exam';

SELECT 'Questions Inserted:' as status, COUNT(*) as count 
FROM caps_exam_questions 
WHERE grade = '9' AND subject = 'Mathematics';
