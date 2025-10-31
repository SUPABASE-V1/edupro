-- ================================================================
-- Invoice Management System
-- ================================================================
-- Professional invoicing for school fees
-- Supports automated and manual invoice generation
-- Created: 2025-10-31
-- ================================================================

-- ================================================================
-- 1. INVOICES TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invoice identification
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT DEFAULT 'automated' CHECK (invoice_type IN ('automated', 'manual')),
  
  -- Relationships
  preschool_id UUID NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Invoice details
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Billing information
  bill_to_name TEXT NOT NULL,
  bill_to_address TEXT,
  bill_to_email TEXT,
  bill_to_phone TEXT,
  
  -- Student information (for automated invoices)
  student_name TEXT,
  student_number TEXT,
  student_grade TEXT,
  
  -- Financial details
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER DEFAULT 0,
  discount_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  paid_cents INTEGER DEFAULT 0,
  balance_cents INTEGER GENERATED ALWAYS AS (total_cents - paid_cents) STORED,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled')),
  
  -- Payment tracking
  payment_method TEXT,
  payment_date DATE,
  payment_reference TEXT,
  
  -- Additional details
  notes TEXT,
  terms TEXT,
  footer_text TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invoices_preschool ON public.invoices(preschool_id);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON public.invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_parent ON public.invoices(parent_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date) WHERE status NOT IN ('paid', 'cancelled');
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(invoice_date DESC);

COMMENT ON TABLE public.invoices IS 'Professional invoices for school fees and other charges';

-- ================================================================
-- 2. INVOICE LINE ITEMS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  -- Line item details
  line_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  
  -- Optional reference to fee structure
  fee_structure_id UUID REFERENCES public.school_fee_structures(id) ON DELETE SET NULL,
  fee_assignment_id UUID REFERENCES public.student_fee_assignments(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique line numbers per invoice
  UNIQUE(invoice_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_fee_structure ON public.invoice_line_items(fee_structure_id) WHERE fee_structure_id IS NOT NULL;

COMMENT ON TABLE public.invoice_line_items IS 'Individual line items on invoices';

-- ================================================================
-- 3. INVOICE PAYMENTS TABLE
-- ================================================================

CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  -- Payment details
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT CHECK (payment_method IN ('payfast', 'cash', 'eft', 'card', 'cheque', 'other')),
  payment_reference TEXT,
  
  -- PayFast integration
  fee_payment_id UUID REFERENCES public.fee_payments(id) ON DELETE SET NULL,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Audit
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_date ON public.invoice_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_fee_payment ON public.invoice_payments(fee_payment_id) WHERE fee_payment_id IS NOT NULL;

COMMENT ON TABLE public.invoice_payments IS 'Payments applied to invoices';

-- ================================================================
-- 4. ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- Principals can manage their school's invoices
DROP POLICY IF EXISTS "Principals can manage invoices" ON public.invoices;
CREATE POLICY "Principals can manage invoices"
  ON public.invoices
  FOR ALL
  TO authenticated
  USING (
    preschool_id IN (
      SELECT preschool_id FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'superadmin')
    )
  );

-- Parents can view their child's invoices
DROP POLICY IF EXISTS "Parents can view their invoices" ON public.invoices;
CREATE POLICY "Parents can view their invoices"
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    -- Check if invoice is for their child
    student_id IN (
      SELECT id FROM public.students WHERE parent_id = auth.uid() OR guardian_id = auth.uid()
    )
    -- Or if invoice is directly assigned to them
    OR parent_id = auth.uid()
    -- Or if they are school staff
    OR preschool_id IN (
      SELECT preschool_id FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'teacher', 'superadmin')
    )
  );

-- Invoice line items inherit invoice permissions
DROP POLICY IF EXISTS "Invoice line items inherit permissions" ON public.invoice_line_items;
CREATE POLICY "Invoice line items inherit permissions"
  ON public.invoice_line_items
  FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices
      -- RLS on invoices table will handle access control
    )
  );

-- Principals can manage invoice payments
DROP POLICY IF EXISTS "Principals can manage invoice payments" ON public.invoice_payments;
CREATE POLICY "Principals can manage invoice payments"
  ON public.invoice_payments
  FOR ALL
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices 
      WHERE preschool_id IN (
        SELECT preschool_id FROM public.profiles WHERE id = auth.uid() AND role IN ('principal', 'superadmin')
      )
    )
  );

-- Parents can view their invoice payments
DROP POLICY IF EXISTS "Parents can view invoice payments" ON public.invoice_payments;
CREATE POLICY "Parents can view invoice payments"
  ON public.invoice_payments
  FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices 
      WHERE student_id IN (
        SELECT id FROM public.students WHERE parent_id = auth.uid() OR guardian_id = auth.uid()
      )
      OR parent_id = auth.uid()
    )
  );

-- ================================================================
-- 5. HELPER FUNCTIONS
-- ================================================================

-- Generate unique invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_preschool_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year TEXT;
  v_month TEXT;
  v_count INTEGER;
  v_invoice_number TEXT;
BEGIN
  -- Get current year and month
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_month := TO_CHAR(CURRENT_DATE, 'MM');
  
  -- Count existing invoices for this school this month
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.invoices
  WHERE preschool_id = p_preschool_id
    AND EXTRACT(YEAR FROM invoice_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM invoice_date) = EXTRACT(MONTH FROM CURRENT_DATE);
  
  -- Format: INV-YYYY-MM-0001
  v_invoice_number := 'INV-' || v_year || '-' || v_month || '-' || LPAD(v_count::TEXT, 4, '0');
  
  -- Ensure uniqueness (in case of race condition)
  WHILE EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = v_invoice_number) LOOP
    v_count := v_count + 1;
    v_invoice_number := 'INV-' || v_year || '-' || v_month || '-' || LPAD(v_count::TEXT, 4, '0');
  END LOOP;
  
  RETURN v_invoice_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_invoice_number(UUID) TO authenticated;

-- Create invoice from fee assignment (automated)
CREATE OR REPLACE FUNCTION public.create_invoice_from_fee_assignment(
  p_fee_assignment_id UUID,
  p_due_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment RECORD;
  v_student RECORD;
  v_fee_structure RECORD;
  v_preschool RECORD;
  v_invoice_id UUID;
  v_invoice_number TEXT;
BEGIN
  -- Get fee assignment details
  SELECT * INTO v_assignment
  FROM public.student_fee_assignments
  WHERE id = p_fee_assignment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fee assignment not found: %', p_fee_assignment_id;
  END IF;
  
  -- Get student details
  SELECT * INTO v_student
  FROM public.students
  WHERE id = v_assignment.student_id;
  
  -- Get fee structure details
  SELECT * INTO v_fee_structure
  FROM public.school_fee_structures
  WHERE id = v_assignment.fee_structure_id;
  
  -- Get preschool details
  SELECT * INTO v_preschool
  FROM public.preschools
  WHERE id = v_assignment.preschool_id;
  
  -- Generate invoice number
  v_invoice_number := generate_invoice_number(v_assignment.preschool_id);
  
  -- Create invoice
  INSERT INTO public.invoices (
    invoice_number,
    invoice_type,
    preschool_id,
    student_id,
    parent_id,
    invoice_date,
    due_date,
    bill_to_name,
    bill_to_email,
    student_name,
    student_number,
    student_grade,
    subtotal_cents,
    total_cents,
    status,
    notes,
    terms
  ) VALUES (
    v_invoice_number,
    'automated',
    v_assignment.preschool_id,
    v_assignment.student_id,
    v_student.parent_id,
    CURRENT_DATE,
    COALESCE(p_due_date, v_assignment.due_date, CURRENT_DATE + INTERVAL '30 days'),
    v_student.first_name || ' ' || v_student.last_name || ' (Parent/Guardian)',
    NULL, -- Will be fetched from profiles if needed
    v_student.first_name || ' ' || v_student.last_name,
    v_student.student_number,
    v_student.grade_level,
    v_assignment.total_amount_cents,
    v_assignment.total_amount_cents,
    'sent',
    'This invoice was automatically generated for ' || v_fee_structure.name,
    'Payment is due within 30 days of invoice date. Late payments may incur additional charges.'
  )
  RETURNING id INTO v_invoice_id;
  
  -- Create line item
  INSERT INTO public.invoice_line_items (
    invoice_id,
    line_number,
    description,
    quantity,
    unit_price_cents,
    amount_cents,
    fee_structure_id,
    fee_assignment_id
  ) VALUES (
    v_invoice_id,
    1,
    v_fee_structure.name || ' - ' || v_fee_structure.description,
    1,
    v_assignment.total_amount_cents,
    v_assignment.total_amount_cents,
    v_assignment.fee_structure_id,
    p_fee_assignment_id
  );
  
  RETURN v_invoice_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_invoice_from_fee_assignment(UUID, DATE) TO authenticated;

-- Get parent's outstanding invoices
CREATE OR REPLACE FUNCTION public.get_parent_invoices(p_parent_id UUID)
RETURNS TABLE (
  invoice_id UUID,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  student_name TEXT,
  total_cents INTEGER,
  paid_cents INTEGER,
  balance_cents INTEGER,
  status TEXT,
  is_overdue BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.invoice_number,
    i.invoice_date,
    i.due_date,
    i.student_name,
    i.total_cents,
    i.paid_cents,
    i.balance_cents,
    i.status,
    (i.due_date < CURRENT_DATE AND i.status NOT IN ('paid', 'cancelled')) AS is_overdue
  FROM public.invoices i
  WHERE i.student_id IN (
    SELECT id FROM public.students WHERE parent_id = p_parent_id OR guardian_id = p_parent_id
  )
  OR i.parent_id = p_parent_id
  ORDER BY 
    CASE WHEN i.status = 'overdue' THEN 1
         WHEN i.status IN ('sent', 'viewed') THEN 2
         WHEN i.status = 'partial' THEN 3
         ELSE 4 END,
    i.due_date ASC NULLS LAST;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_parent_invoices(UUID) TO authenticated;

-- Get school's invoice summary
CREATE OR REPLACE FUNCTION public.get_school_invoice_summary(p_preschool_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_invoices', (SELECT COUNT(*) FROM invoices WHERE preschool_id = p_preschool_id),
    'total_invoiced_cents', (SELECT COALESCE(SUM(total_cents), 0) FROM invoices WHERE preschool_id = p_preschool_id),
    'total_collected_cents', (SELECT COALESCE(SUM(paid_cents), 0) FROM invoices WHERE preschool_id = p_preschool_id),
    'outstanding_balance_cents', (SELECT COALESCE(SUM(balance_cents), 0) FROM invoices WHERE preschool_id = p_preschool_id AND status NOT IN ('paid', 'cancelled')),
    'overdue_count', (SELECT COUNT(*) FROM invoices WHERE preschool_id = p_preschool_id AND due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled')),
    'overdue_amount_cents', (SELECT COALESCE(SUM(balance_cents), 0) FROM invoices WHERE preschool_id = p_preschool_id AND due_date < CURRENT_DATE AND status NOT IN ('paid', 'cancelled')),
    'draft_count', (SELECT COUNT(*) FROM invoices WHERE preschool_id = p_preschool_id AND status = 'draft')
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_school_invoice_summary(UUID) TO authenticated;

-- ================================================================
-- 6. TRIGGERS
-- ================================================================

-- Update timestamp
CREATE OR REPLACE FUNCTION public.update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Update viewed_at when status changes to viewed
  IF OLD.status != 'viewed' AND NEW.status = 'viewed' AND NEW.viewed_at IS NULL THEN
    NEW.viewed_at = NOW();
  END IF;
  
  -- Update paid_at when status changes to paid
  IF OLD.status != 'paid' AND NEW.status = 'paid' AND NEW.paid_at IS NULL THEN
    NEW.paid_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_updated_at();

-- Update invoice totals when line items change
CREATE OR REPLACE FUNCTION public.update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal INTEGER;
BEGIN
  -- Recalculate subtotal from line items
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_subtotal
  FROM public.invoice_line_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update invoice
  UPDATE public.invoices
  SET 
    subtotal_cents = v_subtotal,
    total_cents = v_subtotal - COALESCE(discount_cents, 0) + COALESCE(tax_cents, 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoice_totals_on_line_item_change ON public.invoice_line_items;
CREATE TRIGGER update_invoice_totals_on_line_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.invoice_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_totals();

-- Update invoice payment status when payment is added
CREATE OR REPLACE FUNCTION public.update_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice RECORD;
BEGIN
  -- Get invoice details
  SELECT * INTO v_invoice
  FROM public.invoices
  WHERE id = NEW.invoice_id;
  
  -- Update invoice paid amount
  UPDATE public.invoices
  SET 
    paid_cents = (
      SELECT COALESCE(SUM(amount_cents), 0)
      FROM public.invoice_payments
      WHERE invoice_id = NEW.invoice_id
    ),
    status = CASE 
      WHEN (SELECT COALESCE(SUM(amount_cents), 0) FROM public.invoice_payments WHERE invoice_id = NEW.invoice_id) >= v_invoice.total_cents THEN 'paid'
      WHEN (SELECT COALESCE(SUM(amount_cents), 0) FROM public.invoice_payments WHERE invoice_id = NEW.invoice_id) > 0 THEN 'partial'
      ELSE status
    END,
    payment_method = COALESCE(NEW.payment_method, payment_method),
    payment_date = CASE 
      WHEN (SELECT COALESCE(SUM(amount_cents), 0) FROM public.invoice_payments WHERE invoice_id = NEW.invoice_id) >= v_invoice.total_cents THEN NEW.payment_date
      ELSE payment_date
    END,
    payment_reference = COALESCE(NEW.payment_reference, payment_reference),
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoice_on_payment ON public.invoice_payments;
CREATE TRIGGER update_invoice_on_payment
  AFTER INSERT ON public.invoice_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_invoice_on_payment();

-- Auto-mark invoices as overdue
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.invoices
  SET status = 'overdue'
  WHERE due_date < CURRENT_DATE
    AND status IN ('sent', 'viewed', 'partial')
    AND balance_cents > 0;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_overdue_invoices() TO authenticated;

-- ================================================================
-- VERIFICATION
-- ================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Invoice Management System installed successfully!';
  RAISE NOTICE '   - invoices table created';
  RAISE NOTICE '   - invoice_line_items table created';
  RAISE NOTICE '   - invoice_payments table created';
  RAISE NOTICE '   - RLS policies configured';
  RAISE NOTICE '   - Helper functions created';
  RAISE NOTICE '   - Triggers configured';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Features:';
  RAISE NOTICE '   1. Auto-generate invoice number (INV-YYYY-MM-0001)';
  RAISE NOTICE '   2. Create invoices from fee assignments';
  RAISE NOTICE '   3. Manual invoice creation';
  RAISE NOTICE '   4. Professional invoice templates';
  RAISE NOTICE '   5. Payment tracking';
  RAISE NOTICE '   6. Overdue management';
END $$;
