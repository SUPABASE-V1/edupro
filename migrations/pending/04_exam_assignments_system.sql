-- ================================================================
-- Exam Assignment System
-- ================================================================
-- Enables teachers to assign exams to students and track results
-- Created: 2025-10-31
-- ================================================================

-- PREREQUISITE: This migration requires exam_generations table
-- Run migration: 20251030141353_add_exam_prep_tables.sql first!

-- ================================================================
-- 1. EXAM ASSIGNMENTS TABLE
-- ================================================================
-- Stores which exams are assigned to which students/classes

CREATE TABLE IF NOT EXISTS public.exam_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_generation_id UUID REFERENCES public.exam_generations(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Assignment targets
  student_ids UUID[] NOT NULL DEFAULT '{}',
  class_id UUID, -- Optional: if assigned to whole class
  
  -- Timing
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  
  -- Settings
  allow_late_submission BOOLEAN DEFAULT true,
  show_correct_answers BOOLEAN DEFAULT false, -- Show answers after submission
  max_attempts INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_assignments_teacher ON public.exam_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_class ON public.exam_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_status ON public.exam_assignments(status);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_due_date ON public.exam_assignments(due_date);

-- GIN index for student_ids array queries
CREATE INDEX IF NOT EXISTS idx_exam_assignments_student_ids ON public.exam_assignments USING GIN(student_ids);

COMMENT ON TABLE public.exam_assignments IS 'Tracks exam assignments from teachers to students';


-- ================================================================
-- 2. EXAM SUBMISSIONS TABLE
-- ================================================================
-- Stores student responses and scores

CREATE TABLE IF NOT EXISTS public.exam_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES public.exam_assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Submission data
  answers JSONB NOT NULL DEFAULT '{}',
  score DECIMAL(5,2), -- e.g., 85.50
  max_score DECIMAL(5,2), -- Total possible points
  percentage DECIMAL(5,2), -- Calculated percentage
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER, -- Duration in seconds
  
  -- Status
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  attempt_number INTEGER DEFAULT 1,
  
  -- Feedback
  teacher_feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: one submission per student per assignment per attempt
  UNIQUE(assignment_id, student_id, attempt_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exam_submissions_assignment ON public.exam_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_student ON public.exam_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_status ON public.exam_submissions(status);
CREATE INDEX IF NOT EXISTS idx_exam_submissions_submitted_at ON public.exam_submissions(submitted_at);

COMMENT ON TABLE public.exam_submissions IS 'Stores student exam submissions and results';


-- ================================================================
-- 3. ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.exam_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_submissions ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own assignments
CREATE POLICY "Teachers can create assignments"
  ON public.exam_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can view their assignments"
  ON public.exam_assignments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = teacher_id
    OR auth.uid() = ANY(student_ids)
  );

CREATE POLICY "Teachers can update their assignments"
  ON public.exam_assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their assignments"
  ON public.exam_assignments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = teacher_id);

-- Students can view and submit
CREATE POLICY "Students can view their submissions"
  ON public.exam_submissions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = student_id
    OR auth.uid() IN (
      SELECT teacher_id FROM public.exam_assignments 
      WHERE id = assignment_id
    )
  );

CREATE POLICY "Students can create submissions"
  ON public.exam_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own submissions"
  ON public.exam_submissions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id OR auth.uid() IN (
    SELECT teacher_id FROM public.exam_assignments WHERE id = assignment_id
  ))
  WITH CHECK (auth.uid() = student_id OR auth.uid() IN (
    SELECT teacher_id FROM public.exam_assignments WHERE id = assignment_id
  ));


-- ================================================================
-- 4. HELPER FUNCTIONS
-- ================================================================

-- Function to get assignment statistics
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
    'submitted_count', (
      SELECT COUNT(*) 
      FROM public.exam_submissions 
      WHERE assignment_id = assignment_uuid 
      AND status = 'submitted'
    ),
    'average_score', (
      SELECT COALESCE(AVG(percentage), 0) 
      FROM public.exam_submissions 
      WHERE assignment_id = assignment_uuid 
      AND status = 'submitted'
    ),
    'highest_score', (
      SELECT COALESCE(MAX(percentage), 0) 
      FROM public.exam_submissions 
      WHERE assignment_id = assignment_uuid 
      AND status = 'submitted'
    ),
    'lowest_score', (
      SELECT COALESCE(MIN(percentage), 0) 
      FROM public.exam_submissions 
      WHERE assignment_id = assignment_uuid 
      AND status = 'submitted'
    )
  ) INTO result
  FROM public.exam_assignments
  WHERE id = assignment_uuid;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_assignment_stats(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_assignment_stats IS 'Returns statistics for an exam assignment';


-- Function to get student's assigned exams
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
  WHERE auth.uid() = ANY(a.student_ids)
    AND a.status = 'active'
  ORDER BY 
    CASE WHEN s.submitted_at IS NULL THEN 0 ELSE 1 END,
    a.due_date ASC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_exam_assignments() TO authenticated;

COMMENT ON FUNCTION public.get_my_exam_assignments IS 'Returns all exam assignments for the current student';


-- Function to check if student can submit
CREATE OR REPLACE FUNCTION public.can_submit_exam(assignment_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assignment_record RECORD;
  submission_count INTEGER;
  result JSONB;
BEGIN
  -- Get assignment details
  SELECT * INTO assignment_record
  FROM public.exam_assignments
  WHERE id = assignment_uuid
    AND auth.uid() = ANY(student_ids);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'Assignment not found or not assigned to you'
    );
  END IF;
  
  -- Check if assignment is active
  IF assignment_record.status != 'active' THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'Assignment is no longer active'
    );
  END IF;
  
  -- Check due date
  IF assignment_record.due_date IS NOT NULL 
     AND assignment_record.due_date < NOW() 
     AND NOT assignment_record.allow_late_submission THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'Assignment deadline has passed'
    );
  END IF;
  
  -- Check max attempts
  SELECT COUNT(*) INTO submission_count
  FROM public.exam_submissions
  WHERE assignment_id = assignment_uuid
    AND student_id = auth.uid()
    AND status = 'submitted';
  
  IF submission_count >= assignment_record.max_attempts THEN
    RETURN jsonb_build_object(
      'can_submit', false,
      'reason', 'Maximum attempts reached'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_submit', true,
    'attempts_remaining', assignment_record.max_attempts - submission_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_submit_exam(UUID) TO authenticated;

COMMENT ON FUNCTION public.can_submit_exam IS 'Checks if a student can submit an exam';


-- ================================================================
-- 5. TRIGGERS
-- ================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exam_assignments_updated_at
  BEFORE UPDATE ON public.exam_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_submissions_updated_at
  BEFORE UPDATE ON public.exam_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ================================================================
-- 6. SAMPLE DATA (Optional - for testing)
-- ================================================================

-- Uncomment to insert sample data
/*
INSERT INTO public.exam_assignments (
  exam_generation_id,
  teacher_id,
  title,
  description,
  student_ids,
  due_date,
  status
) VALUES (
  (SELECT id FROM public.exam_generations LIMIT 1),
  (SELECT id FROM public.profiles WHERE role = 'teacher' LIMIT 1),
  'Grade 9 Mathematics Practice Test',
  'Complete this practice test before the final exam',
  ARRAY[(SELECT id FROM public.profiles WHERE role = 'student' LIMIT 1)],
  NOW() + INTERVAL '7 days',
  'active'
);
*/

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================

-- Verification query
DO $$
BEGIN
  RAISE NOTICE '✅ Exam Assignment System installed successfully';
  RAISE NOTICE '   - exam_assignments table created';
  RAISE NOTICE '   - exam_submissions table created';
  RAISE NOTICE '   - RLS policies configured';
  RAISE NOTICE '   - Helper functions added';
  RAISE NOTICE '   - Triggers configured';
END $$;
