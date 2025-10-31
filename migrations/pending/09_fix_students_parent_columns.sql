-- ================================================================
-- Fix Students Table - Add parent_id and guardian_id columns
-- ================================================================
-- Ensures students table has proper parent relationship columns
-- These might be missing if older schema was used
-- Created: 2025-10-31
-- ================================================================

-- Add parent_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE public.students ADD COLUMN parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added parent_id column to students table';
  ELSE
    RAISE NOTICE 'parent_id column already exists in students table';
  END IF;
END $$;

-- Add guardian_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'guardian_id'
  ) THEN
    ALTER TABLE public.students ADD COLUMN guardian_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added guardian_id column to students table';
  ELSE
    RAISE NOTICE 'guardian_id column already exists in students table';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON public.students(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_guardian_id ON public.students(guardian_id) WHERE guardian_id IS NOT NULL;

-- Migrate data from parent_ids array to parent_id (if parent_ids exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'parent_ids'
  ) THEN
    -- Update parent_id from first element of parent_ids array
    UPDATE public.students
    SET parent_id = parent_ids[1]
    WHERE parent_ids IS NOT NULL 
      AND array_length(parent_ids, 1) > 0
      AND parent_id IS NULL;
    
    RAISE NOTICE 'Migrated data from parent_ids array to parent_id column';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.students.parent_id IS 'Primary parent/guardian (references profiles.id)';
COMMENT ON COLUMN public.students.guardian_id IS 'Secondary guardian (references profiles.id)';

-- Verification
DO $$
DECLARE
  v_parent_id_exists BOOLEAN;
  v_guardian_id_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'parent_id'
  ) INTO v_parent_id_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'students' 
    AND column_name = 'guardian_id'
  ) INTO v_guardian_id_exists;
  
  IF v_parent_id_exists AND v_guardian_id_exists THEN
    RAISE NOTICE '✅ Students table parent columns verified!';
    RAISE NOTICE '   - parent_id column: EXISTS';
    RAISE NOTICE '   - guardian_id column: EXISTS';
    RAISE NOTICE '   - Indexes created';
    RAISE NOTICE '';
    RAISE NOTICE '📝 You can now use fee and invoice systems!';
  ELSE
    RAISE WARNING '⚠️ Some columns may be missing!';
  END IF;
END $$;
