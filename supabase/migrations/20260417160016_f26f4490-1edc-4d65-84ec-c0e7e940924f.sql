
-- 1. Unified transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  project_id UUID,
  booth_id UUID,
  client_id UUID,
  employee_id UUID,
  vendor_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('income','expense','payroll','reimbursable')),
  nature TEXT NOT NULL CHECK (nature IN ('contract','extra_charge','cost','reimbursable','payroll')),
  category TEXT,
  subcategory TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_by_user_id UUID,
  owed_to_user_id UUID,
  status TEXT NOT NULL,
  invoice_number TEXT,
  due_date TEXT,
  paid_date TEXT,
  receipt_url TEXT,
  notes TEXT,
  -- Source tracking so triggers can keep this table in sync
  source_table TEXT,            -- 'expenses' | 'payments' | 'work_logs' | NULL (manual)
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_id)
);

CREATE INDEX idx_transactions_project ON public.transactions(project_id);
CREATE INDEX idx_transactions_booth ON public.transactions(booth_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_date ON public.transactions(date);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on transactions"
  ON public.transactions FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Authenticated read transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Employee manage own transactions"
  ON public.transactions FOR ALL TO authenticated
  USING (
    paid_by_user_id = auth.uid()
    OR owed_to_user_id = auth.uid()
    OR employee_id = auth.uid()
  )
  WITH CHECK (
    paid_by_user_id = auth.uid()
    OR owed_to_user_id = auth.uid()
    OR employee_id = auth.uid()
  );

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2. Sync helpers
CREATE OR REPLACE FUNCTION public.sync_expense_to_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_paid_by_uuid UUID;
  v_type TEXT;
  v_nature TEXT;
  v_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.transactions WHERE source_table='expenses' AND source_id=OLD.id;
    RETURN OLD;
  END IF;

  -- Try to resolve paid_by (text) to a profile uuid, else NULL
  BEGIN
    v_paid_by_uuid := NEW.paid_by::uuid;
  EXCEPTION WHEN others THEN
    v_paid_by_uuid := NULL;
  END;

  IF NEW.reimbursed IS NOT NULL AND NEW.user_id IS NOT NULL AND NEW.reimbursed = false THEN
    v_type := 'reimbursable';
    v_nature := 'reimbursable';
    v_status := 'not_billed';
  ELSIF NEW.user_id IS NOT NULL AND NEW.reimbursed = true THEN
    v_type := 'reimbursable';
    v_nature := 'reimbursable';
    v_status := 'recovered';
  ELSE
    v_type := 'expense';
    v_nature := 'cost';
    v_status := 'paid';
  END IF;

  INSERT INTO public.transactions (
    date, project_id, booth_id, vendor_name, type, nature,
    category, subcategory, amount, paid_by_user_id, owed_to_user_id,
    status, receipt_url, notes, source_table, source_id
  ) VALUES (
    NEW.date, NEW.project_id, NEW.booth_id, NEW.paid_by, v_type, v_nature,
    NEW.main_category, NEW.sub_category, NEW.amount,
    COALESCE(v_paid_by_uuid, NEW.user_id), NEW.user_id,
    v_status, NEW.receipt_url, NEW.description, 'expenses', NEW.id
  )
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    date = EXCLUDED.date,
    project_id = EXCLUDED.project_id,
    booth_id = EXCLUDED.booth_id,
    vendor_name = EXCLUDED.vendor_name,
    type = EXCLUDED.type,
    nature = EXCLUDED.nature,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    amount = EXCLUDED.amount,
    paid_by_user_id = EXCLUDED.paid_by_user_id,
    owed_to_user_id = EXCLUDED.owed_to_user_id,
    status = EXCLUDED.status,
    receipt_url = EXCLUDED.receipt_url,
    notes = EXCLUDED.notes;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_payment_to_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_project UUID;
  v_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.transactions WHERE source_table='payments' AND source_id=OLD.id;
    RETURN OLD;
  END IF;

  SELECT project_id INTO v_project FROM public.booths WHERE id = NEW.booth_id;

  v_status := CASE NEW.status
    WHEN 'received' THEN 'paid'
    WHEN 'invoiced' THEN 'invoiced'
    ELSE 'draft'
  END;

  INSERT INTO public.transactions (
    date, project_id, booth_id, type, nature, category, subcategory,
    amount, status, due_date, paid_date, receipt_url, notes,
    source_table, source_id
  ) VALUES (
    COALESCE(NEW.invoice_date, NEW.received_date, to_char(now(), 'YYYY-MM-DD')),
    v_project, NEW.booth_id, 'income',
    CASE WHEN NEW.type = 'deposit' THEN 'contract' ELSE 'contract' END,
    'payment', NEW.type, NEW.amount, v_status,
    NEW.invoice_date, NEW.received_date, NEW.document_url, NEW.notes,
    'payments', NEW.id
  )
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    date = EXCLUDED.date,
    project_id = EXCLUDED.project_id,
    booth_id = EXCLUDED.booth_id,
    subcategory = EXCLUDED.subcategory,
    amount = EXCLUDED.amount,
    status = EXCLUDED.status,
    due_date = EXCLUDED.due_date,
    paid_date = EXCLUDED.paid_date,
    receipt_url = EXCLUDED.receipt_url,
    notes = EXCLUDED.notes;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_worklog_to_transaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_amount NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.transactions WHERE source_table='work_logs' AND source_id=OLD.id;
    RETURN OLD;
  END IF;

  v_amount := CASE
    WHEN NEW.rate_type = 'hourly' THEN COALESCE(NEW.hours, 0) * NEW.daily_rate
    ELSE NEW.daily_rate
  END;

  INSERT INTO public.transactions (
    date, project_id, booth_id, employee_id, type, nature,
    category, subcategory, amount, owed_to_user_id, status,
    notes, source_table, source_id
  ) VALUES (
    NEW.date, NEW.project_id, NEW.booth_id, NEW.auth_user_id, 'payroll', 'payroll',
    '人工', NEW.rate_type, v_amount, NEW.auth_user_id, 'unpaid',
    NEW.user_name, 'work_logs', NEW.id
  )
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    date = EXCLUDED.date,
    project_id = EXCLUDED.project_id,
    booth_id = EXCLUDED.booth_id,
    employee_id = EXCLUDED.employee_id,
    subcategory = EXCLUDED.subcategory,
    amount = EXCLUDED.amount,
    owed_to_user_id = EXCLUDED.owed_to_user_id,
    notes = EXCLUDED.notes;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_expense_tx
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.sync_expense_to_transaction();

CREATE TRIGGER trg_sync_payment_tx
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_payment_to_transaction();

CREATE TRIGGER trg_sync_worklog_tx
  AFTER INSERT OR UPDATE OR DELETE ON public.work_logs
  FOR EACH ROW EXECUTE FUNCTION public.sync_worklog_to_transaction();

-- 3. Backfill from existing rows
INSERT INTO public.transactions (
  date, project_id, booth_id, vendor_name, type, nature,
  category, subcategory, amount, paid_by_user_id, owed_to_user_id,
  status, receipt_url, notes, source_table, source_id
)
SELECT
  e.date, e.project_id, e.booth_id, e.paid_by,
  CASE WHEN e.user_id IS NOT NULL AND e.reimbursed = false THEN 'reimbursable'
       WHEN e.user_id IS NOT NULL AND e.reimbursed = true THEN 'reimbursable'
       ELSE 'expense' END,
  CASE WHEN e.user_id IS NOT NULL THEN 'reimbursable' ELSE 'cost' END,
  e.main_category, e.sub_category, e.amount,
  e.user_id, e.user_id,
  CASE
    WHEN e.user_id IS NOT NULL AND e.reimbursed = false THEN 'not_billed'
    WHEN e.user_id IS NOT NULL AND e.reimbursed = true THEN 'recovered'
    ELSE 'paid'
  END,
  e.receipt_url, e.description, 'expenses', e.id
FROM public.expenses e
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.transactions (
  date, project_id, booth_id, type, nature, category, subcategory,
  amount, status, due_date, paid_date, receipt_url, notes,
  source_table, source_id
)
SELECT
  COALESCE(p.invoice_date, p.received_date, to_char(now(),'YYYY-MM-DD')),
  b.project_id, p.booth_id, 'income', 'contract', 'payment', p.type,
  p.amount,
  CASE p.status WHEN 'received' THEN 'paid' WHEN 'invoiced' THEN 'invoiced' ELSE 'draft' END,
  p.invoice_date, p.received_date, p.document_url, p.notes,
  'payments', p.id
FROM public.payments p
LEFT JOIN public.booths b ON b.id = p.booth_id
ON CONFLICT (source_table, source_id) DO NOTHING;

INSERT INTO public.transactions (
  date, project_id, booth_id, employee_id, type, nature,
  category, subcategory, amount, owed_to_user_id, status,
  notes, source_table, source_id
)
SELECT
  w.date, w.project_id, w.booth_id, w.auth_user_id, 'payroll', 'payroll',
  '人工', w.rate_type,
  CASE WHEN w.rate_type = 'hourly' THEN COALESCE(w.hours, 0) * w.daily_rate ELSE w.daily_rate END,
  w.auth_user_id, 'unpaid', w.user_name, 'work_logs', w.id
FROM public.work_logs w
ON CONFLICT (source_table, source_id) DO NOTHING;
