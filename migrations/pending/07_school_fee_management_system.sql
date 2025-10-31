-- ================================================================
-- School Fee Management System
-- ================================================================
-- Allows principals/admins to configure fee structures
-- Supports age groups, payment frequencies, and discounts
-- Created: 2025-10-31
-- ================================================================

-- ================================================================
-- 1. FEE STRUCTURES TABLE
-- ================================================================
-- Master fee configuration per school/preschool

CREATE TABLE IF NOT EXISTS public.school_fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- School relationship
  preschool_id UUID NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  
  -- Fee details
  name TEXT NOT NULL, -- e.g., "Toddlers Monthly Fee", "Grade R Annual Fee"
  description TEXT,
  
  -- Age group / grade level
  age_group TEXT, -- e.g., "0-2", "3-4", "5-6", "grade_r", "grade_1"
  grade_level TEXT, -- Alternative to age_group
  
  -- Pricing
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT DEFAULT 'ZAR',
  billing_frequency TEXT DEFAULT 'monthly' CHECK (billing_frequency IN ('once_off', 'daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  
  -- Optional fees
  is_optional BOOLEAN DEFAULT false,
  is_deposit BOOLEAN DEFAULT false, -- Registration deposit
  
  -- Categories
  fee_category TEXT DEFAULT 'tuition' CHECK (fee_category IN (
    'tuition',        -- Regular school fees
    'registration',   -- Once-off registration
    'deposit',        -- Refundable deposit
    'transport',      -- School bus
    'meals',          -- Food/catering
    'activities',     -- Extra-curricular
    'uniform',        -- School uniform
    'books',          -- Learning materials
    'other'           -- Miscellaneous
  )),
  
  -- Discounts
  early_bird_discount_percent DECIMAL(5,2) DEFAULT 0, -- Pay early discount
  sibling_discount_percent DECIMAL(5,2) DEFAULT 0,    -- Multiple children discount
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  auto_charge BOOLEAN DEFAULT false, -- Auto-deduct on due date
  
  -- Due dates (for annual/quarterly fees)
  due_date DATE,
  due_day_of_month INTEGER CHECK (due_day_of_month BETWEEN 1 AND 31), -- For monthly fees
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_fees_preschool ON public.school_fee_structures(preschool_id);
CREATE INDEX IF NOT EXISTS idx_school_fees_age_group ON public.school_fee_structures(age_group);
CREATE INDEX IF NOT EXISTS idx_school_fees_active ON public.school_fee_structures(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_school_fees_category ON public.school_fee_structures(fee_category);

COMMENT ON TABLE public.school_fee_structures IS 'School fee configurations set by principals/admins';

-- ================================================================
-- 2. STUDENT FEE ASSIGNMENTS TABLE
-- ================================================================
-- Links specific fees to specific students

CREATE TABLE IF NOT EXISTS public.student_fee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  fee_structure_id UUID NOT NULL REFERENCES public.school_fee_structures(id) ON DELETE CASCADE,
  preschool_id UUID NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  
  -- Override pricing (if different from standard)
  override_amount_cents INTEGER,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_reason TEXT,
  
  -- Payment tracking
  total_amount_cents INTEGER NOT NULL,
  paid_amount_cents INTEGER DEFAULT 0,
  balance_cents INTEGER GENERATED ALWAYS AS (total_amount_cents - paid_amount_cents) STORED,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
  
  -- Dates
  assigned_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one fee assignment per student per structure
  UNIQUE(student_id, fee_structure_id, assigned_date)
);

CREATE INDEX IF NOT EXISTS idx_student_fees_student ON public.student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_structure ON public.student_fee_assignments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_preschool ON public.student_fee_assignments(preschool_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON public.student_fee_assignments(status);
CREATE INDEX IF NOT EXISTS idx_student_fees_due_date ON public.student_fee_assignments(due_date) WHERE status != 'paid';

COMMENT ON TABLE public.student_fee_assignments IS 'Individual student fee assignments and payment tracking';

-- ================================================================
-- 3. FEE PAYMENTS TABLE
-- ================================================================
-- Records all fee payments

CREATE TABLE IF NOT EXISTS public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  student_fee_assignment_id UUID NOT NULL REFERENCES public.student_fee_assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  preschool_id UUID NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  
  -- Payment details
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT DEFAULT 'ZAR',
  payment_method TEXT CHECK (payment_method IN ('payfast', 'cash', 'eft', 'card', 'other')),
  
  -- PayFast integration
  payfast_payment_id TEXT UNIQUE,
  payfast_transaction_id TEXT,
  payfast_status TEXT,
  
  -- Reference
  reference_number TEXT,
  receipt_number TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Dates
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_assignment ON public.fee_payments(student_fee_assignment_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON public.fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_preschool ON public.fee_payments(preschool_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payfast_id ON public.fee_payments(payfast_payment_id) WHERE payfast_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fee_payments_status ON public.fee_payments(status);
CREATE INDEX IF NOT EXISTS idx_fee_payments_date ON public.fee_payments(payment_date DESC);

COMMENT ON TABLE public.fee_payments IS 'Individual fee payment transactions';

-- ================================================================
-- 4. ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.school_fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;

-- Principals can manage their school's fees
DROP POLICY IF EXISTS "Principals can manage fee structures" ON public.school_fee_structures;
CREATE POLICY "Principals can manage fee structures"
  ON public.school_fee_structures
  FOR ALL
  TO authenticated
  USING (
    preschool_id IN (
      SELECT preschool_id FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'superadmin')
    )
  );

-- Parents can view fees for their children
DROP POLICY IF EXISTS "Parents can view their children's fees" ON public.student_fee_assignments;
CREATE POLICY "Parents can view their children's fees"
  ON public.student_fee_assignments
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.profiles WHERE parent_id = auth.uid()
    )
    OR auth.uid() = student_id
    OR preschool_id IN (
      SELECT preschool_id FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'teacher', 'superadmin')
    )
  );

-- School staff can manage fee assignments
DROP POLICY IF EXISTS "School staff can manage fee assignments" ON public.student_fee_assignments;
CREATE POLICY "School staff can manage fee assignments"
  ON public.student_fee_assignments
  FOR ALL
  TO authenticated
  USING (
    preschool_id IN (
      SELECT preschool_id FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'superadmin')
    )
  );

-- Parents can view their payment history
DROP POLICY IF EXISTS "Parents can view their payments" ON public.fee_payments;
CREATE POLICY "Parents can view their payments"
  ON public.fee_payments
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.profiles WHERE parent_id = auth.uid()
    )
    OR preschool_id IN (
      SELECT preschool_id FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'superadmin')
    )
  );

-- School staff can manage payments
DROP POLICY IF EXISTS "School staff can manage payments" ON public.fee_payments;
CREATE POLICY "School staff can manage payments"
  ON public.fee_payments
  FOR ALL
  TO authenticated
  USING (
    preschool_id IN (
      SELECT preschool_id FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'superadmin')
    )
  );

-- ================================================================
-- 5. HELPER FUNCTIONS
-- ================================================================

-- Get parent's outstanding fees
CREATE OR REPLACE FUNCTION public.get_parent_outstanding_fees(p_parent_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  fee_name TEXT,
  amount_cents INTEGER,
  paid_cents INTEGER,
  balance_cents INTEGER,
  due_date DATE,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sfa.student_id,
    p.first_name || ' ' || COALESCE(p.last_name, '') AS student_name,
    sfs.name AS fee_name,
    sfa.total_amount_cents AS amount_cents,
    sfa.paid_amount_cents AS paid_cents,
    sfa.balance_cents,
    sfa.due_date,
    sfa.status
  FROM public.student_fee_assignments sfa
  JOIN public.profiles p ON sfa.student_id = p.id
  JOIN public.school_fee_structures sfs ON sfa.fee_structure_id = sfs.id
  WHERE p.parent_id = p_parent_id
    AND sfa.status IN ('pending', 'partial', 'overdue')
  ORDER BY sfa.due_date ASC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_parent_outstanding_fees(UUID) TO authenticated;

-- Get school's fee summary
CREATE OR REPLACE FUNCTION public.get_school_fee_summary(p_preschool_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_students', (SELECT COUNT(DISTINCT student_id) FROM student_fee_assignments WHERE preschool_id = p_preschool_id),
    'total_fees_assigned_cents', (SELECT COALESCE(SUM(total_amount_cents), 0) FROM student_fee_assignments WHERE preschool_id = p_preschool_id),
    'total_collected_cents', (SELECT COALESCE(SUM(paid_amount_cents), 0) FROM student_fee_assignments WHERE preschool_id = p_preschool_id),
    'outstanding_balance_cents', (SELECT COALESCE(SUM(balance_cents), 0) FROM student_fee_assignments WHERE preschool_id = p_preschool_id AND status IN ('pending', 'partial', 'overdue')),
    'overdue_count', (SELECT COUNT(*) FROM student_fee_assignments WHERE preschool_id = p_preschool_id AND status = 'overdue')
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_school_fee_summary(UUID) TO authenticated;

-- Auto-assign fees to new students based on age group
CREATE OR REPLACE FUNCTION public.auto_assign_fees_to_student(p_student_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_record RECORD;
  fee_record RECORD;
  assigned_count INTEGER := 0;
BEGIN
  -- Get student details
  SELECT id, preschool_id, age_group, grade_level
  INTO student_record
  FROM public.profiles
  WHERE id = p_student_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Find matching fees for this student's age group
  FOR fee_record IN
    SELECT *
    FROM public.school_fee_structures
    WHERE preschool_id = student_record.preschool_id
      AND is_active = true
      AND (
        age_group = student_record.age_group
        OR grade_level = student_record.grade_level
        OR (age_group IS NULL AND grade_level IS NULL) -- School-wide fees
      )
  LOOP
    -- Assign fee to student (if not already assigned)
    INSERT INTO public.student_fee_assignments (
      student_id,
      fee_structure_id,
      preschool_id,
      total_amount_cents,
      due_date,
      status
    )
    SELECT
      p_student_id,
      fee_record.id,
      student_record.preschool_id,
      fee_record.amount_cents,
      CASE 
        WHEN fee_record.due_date IS NOT NULL THEN fee_record.due_date
        WHEN fee_record.due_day_of_month IS NOT NULL THEN 
          DATE_TRUNC('month', CURRENT_DATE) + (fee_record.due_day_of_month || ' days')::INTERVAL
        ELSE CURRENT_DATE + INTERVAL '30 days'
      END,
      'pending'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.student_fee_assignments
      WHERE student_id = p_student_id
        AND fee_structure_id = fee_record.id
        AND EXTRACT(YEAR FROM assigned_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    );
    
    IF FOUND THEN
      assigned_count := assigned_count + 1;
    END IF;
  END LOOP;
  
  RETURN assigned_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_assign_fees_to_student(UUID) TO authenticated;

COMMENT ON FUNCTION public.auto_assign_fees_to_student IS 'Auto-assigns applicable fees to a student based on age group';

-- ================================================================
-- 6. TRIGGERS
-- ================================================================

-- Update timestamp
CREATE OR REPLACE FUNCTION public.update_fee_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_school_fee_structures_updated_at ON public.school_fee_structures;
CREATE TRIGGER update_school_fee_structures_updated_at
  BEFORE UPDATE ON public.school_fee_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fee_updated_at();

DROP TRIGGER IF EXISTS update_student_fee_assignments_updated_at ON public.student_fee_assignments;
CREATE TRIGGER update_student_fee_assignments_updated_at
  BEFORE UPDATE ON public.student_fee_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fee_updated_at();

DROP TRIGGER IF EXISTS update_fee_payments_updated_at ON public.fee_payments;
CREATE TRIGGER update_fee_payments_updated_at
  BEFORE UPDATE ON public.fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fee_updated_at();

-- Update payment status when payment is made
CREATE OR REPLACE FUNCTION public.update_fee_assignment_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  assignment_record RECORD;
BEGIN
  IF NEW.status = 'completed' THEN
    -- Update the fee assignment
    UPDATE public.student_fee_assignments
    SET 
      paid_amount_cents = paid_amount_cents + NEW.amount_cents,
      paid_date = CASE WHEN balance_cents <= NEW.amount_cents THEN NEW.payment_date ELSE paid_date END,
      status = CASE 
        WHEN balance_cents <= NEW.amount_cents THEN 'paid'
        WHEN paid_amount_cents > 0 THEN 'partial'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = NEW.student_fee_assignment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_assignment_on_payment ON public.fee_payments;
CREATE TRIGGER update_assignment_on_payment
  AFTER INSERT OR UPDATE ON public.fee_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_fee_assignment_on_payment();

-- ================================================================
-- 7. DEFAULT FEE TEMPLATES
-- ================================================================
-- Helper function to create default fee structure for new schools

CREATE OR REPLACE FUNCTION public.create_default_fee_structures(p_preschool_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INTEGER := 0;
BEGIN
  -- Toddlers (0-2 years)
  INSERT INTO public.school_fee_structures (
    preschool_id, name, description, age_group, amount_cents, 
    billing_frequency, fee_category, is_active
  ) VALUES (
    p_preschool_id, 
    'Toddlers Monthly Fee', 
    'Monthly tuition for children aged 0-2 years',
    '0-2',
    150000, -- R1,500.00
    'monthly',
    'tuition',
    true
  );
  inserted_count := inserted_count + 1;

  -- Preschool (3-4 years)
  INSERT INTO public.school_fee_structures (
    preschool_id, name, description, age_group, amount_cents,
    billing_frequency, fee_category, is_active
  ) VALUES (
    p_preschool_id,
    'Preschool Monthly Fee',
    'Monthly tuition for children aged 3-4 years',
    '3-4',
    120000, -- R1,200.00
    'monthly',
    'tuition',
    true
  );
  inserted_count := inserted_count + 1;

  -- Grade R (5-6 years)
  INSERT INTO public.school_fee_structures (
    preschool_id, name, description, age_group, amount_cents,
    billing_frequency, fee_category, is_active
  ) VALUES (
    p_preschool_id,
    'Grade R Monthly Fee',
    'Monthly tuition for Grade R learners',
    '5-6',
    100000, -- R1,000.00
    'monthly',
    'tuition',
    true
  );
  inserted_count := inserted_count + 1;

  -- Registration fee (once-off)
  INSERT INTO public.school_fee_structures (
    preschool_id, name, description, amount_cents,
    billing_frequency, fee_category, is_optional, is_active
  ) VALUES (
    p_preschool_id,
    'Registration Fee',
    'One-time registration fee for new students',
    50000, -- R500.00
    'once_off',
    'registration',
    false,
    true
  );
  inserted_count := inserted_count + 1;

  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_default_fee_structures(UUID) TO authenticated;

COMMENT ON FUNCTION public.create_default_fee_structures IS 'Creates default fee structures for a new school (principal can modify)';

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ School Fee Management System installed successfully!';
  RAISE NOTICE '   - school_fee_structures table created';
  RAISE NOTICE '   - student_fee_assignments table created';
  RAISE NOTICE '   - fee_payments table created';
  RAISE NOTICE '   - RLS policies configured';
  RAISE NOTICE '   - Helper functions created';
  RAISE NOTICE '   - Triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Principals can set up fees in dashboard';
  RAISE NOTICE '   2. Fees auto-assign to students by age group';
  RAISE NOTICE '   3. Parents can pay via PayFast integration';
  RAISE NOTICE '   4. Real-time payment tracking';
END $$;
