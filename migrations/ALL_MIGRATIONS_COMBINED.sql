-- ================================================================
-- COMBINED MIGRATIONS - RUN THIS FILE
-- ================================================================
-- This file combines all pending migrations in the correct order
-- Run this ONE file in your Supabase SQL Editor
-- ================================================================

-- ================================================================
-- MIGRATION 1: Exam Prep Tables (REQUIRED FIRST!)
-- ================================================================
-- Creates: exam_generations, past_papers, exam_user_progress
-- Source: supabase/migrations/20251030141353_add_exam_prep_tables.sql
-- ================================================================

CREATE TABLE IF NOT EXISTS public.past_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  year INT,
  term INT CHECK (term BETWEEN 1 AND 4),
  paper_number INT CHECK (paper_number BETWEEN 1 AND 3),
  exam_type TEXT DEFAULT 'past_paper' CHECK (exam_type IN ('past_paper', 'mock_exam', 'practice_test')),
  title TEXT NOT NULL,
  description TEXT,
  total_marks INT,
  duration_minutes INT,
  file_url TEXT,
  preview_url TEXT,
  memo_file_url TEXT,
  is_public BOOLEAN DEFAULT true,
  download_count INT DEFAULT 0,
  average_score NUMERIC(5,2),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_past_papers_grade_subject ON public.past_papers(grade, subject);
CREATE INDEX IF NOT EXISTS idx_past_papers_year_term ON public.past_papers(year, term);
CREATE INDEX IF NOT EXISTS idx_past_papers_public ON public.past_papers(is_public) WHERE is_public = true;

ALTER TABLE public.past_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public papers are viewable by everyone" ON public.past_papers FOR SELECT USING (is_public = true);
CREATE POLICY "Authenticated users can view all papers" ON public.past_papers FOR SELECT TO authenticated USING (true);

-- ⭐ THIS IS THE KEY TABLE!
CREATE TABLE IF NOT EXISTS public.exam_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('practice_test', 'revision_notes', 'study_guide', 'flashcards')),
  prompt TEXT,
  generated_content TEXT,
  display_title TEXT,
  metadata JSONB DEFAULT '{}',
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_generations_user ON public.exam_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_generations_grade_subject ON public.exam_generations(grade, subject);

ALTER TABLE public.exam_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exam generations" ON public.exam_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exam generations" ON public.exam_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exam generations" ON public.exam_generations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own exam generations" ON public.exam_generations FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.exam_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  past_paper_id UUID REFERENCES public.past_papers(id) ON DELETE SET NULL,
  exam_generation_id UUID REFERENCES public.exam_generations(id) ON DELETE SET NULL,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  exam_title TEXT,
  attempt_number INT DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  time_spent_minutes INT,
  score_obtained NUMERIC(6,2),
  score_total NUMERIC(6,2),
  percentage NUMERIC(5,2),
  section_scores JSONB,
  user_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK ((past_paper_id IS NOT NULL) OR (exam_generation_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_exam_user_progress_user ON public.exam_user_progress(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_user_progress_generation ON public.exam_user_progress(exam_generation_id);

ALTER TABLE public.exam_user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" ON public.exam_user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON public.exam_user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.exam_user_progress FOR UPDATE USING (auth.uid() = user_id);

-- ================================================================
-- MIGRATION 2: Exam Assignments System
-- ================================================================
-- Creates: exam_assignments, exam_submissions
-- Depends on: exam_generations (created above)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_generation_id UUID REFERENCES public.exam_generations(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  student_ids UUID[] NOT NULL DEFAULT '{}',
  class_id UUID,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  allow_late_submission BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT false,
  max_attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_assignments_teacher ON public.exam_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_class ON public.exam_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_status ON public.exam_assignments(status);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_due_date ON public.exam_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_student_ids ON public.exam_assignments USING GIN(student_ids);

ALTER TABLE public.exam_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can create assignments" ON public.exam_assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can view their assignments" ON public.exam_assignments FOR SELECT TO authenticated USING (auth.uid() = teacher_id OR auth.uid() = ANY(student_ids));
CREATE POLICY "Teachers can update their assignments" ON public.exam_assignments FOR UPDATE TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete their assignments" ON public.exam_assignments FOR DELETE TO authenticated USING (auth.uid() = teacher_id);

CREATE TABLE IF NOT EXISTS public.exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.exam_assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  percentage DECIMAL(5,2),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  attempt_number INTEGER DEFAULT 1,
  teacher_feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_exam_submissions_assignment ON public.exam_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student ON public.exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_status ON public.exam_submissions(status);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_submitted_at ON public.exam_submissions(submitted_at);

ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their submissions" ON public.exam_submissions FOR SELECT TO authenticated USING (
  auth.uid() = student_id OR auth.uid() IN (SELECT teacher_id FROM public.exam_assignments WHERE id = assignment_id)
);

CREATE POLICY "Students can create submissions" ON public.exam_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own submissions" ON public.exam_submissions FOR UPDATE TO authenticated 
  USING (auth.uid() = student_id OR auth.uid() IN (SELECT teacher_id FROM public.exam_assignments WHERE id = assignment_id))
  WITH CHECK (auth.uid() = student_id OR auth.uid() IN (SELECT teacher_id FROM public.exam_assignments WHERE id = assignment_id));

-- Helper function: Get assignment statistics
CREATE OR REPLACE FUNCTION public.get_assignment_stats(assignment_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_students', array_length(student_ids, 1),
    'submitted_count', (SELECT COUNT(*) FROM public.exam_submissions WHERE assignment_id = assignment_uuid AND status = 'submitted'),
    'average_score', (SELECT COALESCE(AVG(percentage), 0) FROM public.exam_submissions WHERE assignment_id = assignment_uuid AND status = 'submitted'),
    'highest_score', (SELECT COALESCE(MAX(percentage), 0) FROM public.exam_submissions WHERE assignment_id = assignment_uuid AND status = 'submitted'),
    'lowest_score', (SELECT COALESCE(MIN(percentage), 0) FROM public.exam_submissions WHERE assignment_id = assignment_uuid AND status = 'submitted')
  ) INTO result
  FROM public.exam_assignments
  WHERE id = assignment_uuid;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_assignment_stats(UUID) TO authenticated;

-- Helper function: Get student's assigned exams
CREATE OR REPLACE FUNCTION public.get_my_exam_assignments()
RETURNS TABLE (
  assignment_id UUID,
  exam_title TEXT,
  teacher_name TEXT,
  subject TEXT,
  grade TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT,
  my_submission_id UUID,
  my_score DECIMAL,
  submitted_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS assignment_id,
    a.title AS exam_title,
    p.first_name || ' ' || COALESCE(p.last_name, '') AS teacher_name,
    eg.subject,
    eg.grade,
    a.due_date,
    a.status,
    s.id AS my_submission_id,
    s.percentage AS my_score,
    s.submitted_at
  FROM public.exam_assignments a
  JOIN public.exam_generations eg ON a.exam_generation_id = eg.id
  JOIN public.profiles p ON a.teacher_id = p.id
  LEFT JOIN public.exam_submissions s ON s.assignment_id = a.id AND s.student_id = auth.uid()
  WHERE auth.uid() = ANY(a.student_ids) AND a.status = 'active'
  ORDER BY CASE WHEN s.submitted_at IS NULL THEN 0 ELSE 1 END, a.due_date ASC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_exam_assignments() TO authenticated;

-- Helper function: Check if student can submit
CREATE OR REPLACE FUNCTION public.can_submit_exam(assignment_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assignment_record RECORD;
  submission_count INTEGER;
BEGIN
  SELECT * INTO assignment_record FROM public.exam_assignments WHERE id = assignment_uuid AND auth.uid() = ANY(student_ids);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_submit', false, 'reason', 'Assignment not found or not assigned to you');
  END IF;
  
  IF assignment_record.status != 'active' THEN
    RETURN jsonb_build_object('can_submit', false, 'reason', 'Assignment is no longer active');
  END IF;
  
  IF assignment_record.due_date IS NOT NULL AND assignment_record.due_date < NOW() AND NOT assignment_record.allow_late_submission THEN
    RETURN jsonb_build_object('can_submit', false, 'reason', 'Assignment deadline has passed');
  END IF;
  
  SELECT COUNT(*) INTO submission_count FROM public.exam_submissions WHERE assignment_id = assignment_uuid AND student_id = auth.uid() AND status = 'submitted';
  
  IF submission_count >= assignment_record.max_attempts THEN
    RETURN jsonb_build_object('can_submit', false, 'reason', 'Maximum attempts reached');
  END IF;
  
  RETURN jsonb_build_object('can_submit', true, 'attempts_remaining', assignment_record.max_attempts - submission_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_submit_exam(UUID) TO authenticated;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_exam_assignments_updated_at ON public.exam_assignments;
CREATE TRIGGER update_exam_assignments_updated_at BEFORE UPDATE ON public.exam_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_submissions_updated_at ON public.exam_submissions;
CREATE TRIGGER update_exam_submissions_updated_at BEFORE UPDATE ON public.exam_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================================
-- MIGRATION COMPLETE! ✅
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ ALL MIGRATIONS COMPLETE!';
  RAISE NOTICE '   - exam_generations table created';
  RAISE NOTICE '   - exam_assignments table created';
  RAISE NOTICE '   - exam_submissions table created';
  RAISE NOTICE '   - past_papers table created';
  RAISE NOTICE '   - exam_user_progress table created';
  RAISE NOTICE '   - RLS policies configured';
  RAISE NOTICE '   - Helper functions added';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to test teacher exam assignments!';
END $$;
