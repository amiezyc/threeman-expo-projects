-- ============ PAYMENTS (Receivables) ============
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS received_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date TEXT,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;

-- Backfill received_amount for already-received records
UPDATE public.payments
SET received_amount = amount
WHERE status = 'received' AND received_amount = 0;

-- Helper function: compute payment status from amounts/dates
CREATE OR REPLACE FUNCTION public.compute_payment_status(
  _amount NUMERIC,
  _received NUMERIC,
  _due_date TEXT,
  _current_status TEXT
) RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_due DATE;
BEGIN
  -- Fully received
  IF _received >= _amount AND _amount > 0 THEN
    RETURN 'received';
  END IF;
  -- Partial
  IF _received > 0 AND _received < _amount THEN
    -- Check overdue
    BEGIN
      v_due := _due_date::date;
      IF v_due IS NOT NULL AND v_due < v_today THEN
        RETURN 'overdue';
      END IF;
    EXCEPTION WHEN others THEN NULL;
    END;
    RETURN 'partial';
  END IF;
  -- Zero received -> check if invoiced and overdue
  IF _current_status IN ('invoiced','overdue','partial') OR _current_status = 'invoiced' THEN
    BEGIN
      v_due := _due_date::date;
      IF v_due IS NOT NULL AND v_due < v_today AND _received < _amount THEN
        RETURN 'overdue';
      END IF;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
  RETURN _current_status;
END;
$$;

-- ============ EXPENSES ============
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS reimburse_status TEXT,
  ADD COLUMN IF NOT EXISTS recovered_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vendor_name TEXT,
  ADD COLUMN IF NOT EXISTS client_id UUID,
  ADD COLUMN IF NOT EXISTS due_date TEXT,
  ADD COLUMN IF NOT EXISTS paid_date TEXT;

-- Backfill reimburse_status from old reimbursed boolean
UPDATE public.expenses
SET reimburse_status = CASE
  WHEN user_id IS NOT NULL AND reimbursed = true THEN 'recovered'
  WHEN user_id IS NOT NULL AND reimbursed = false THEN 'not_billed'
  ELSE NULL
END
WHERE reimburse_status IS NULL;

-- ============ WORK_LOGS (Payroll) ============
ALTER TABLE public.work_logs
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_date TEXT,
  ADD COLUMN IF NOT EXISTS paid_by_user_id UUID;

-- ============ Updated sync triggers ============

-- Payment sync (use received_amount for status mapping)
CREATE OR REPLACE FUNCTION public.sync_payment_to_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_project UUID;
  v_status TEXT;
  v_nature TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.transactions WHERE source_table='payments' AND source_id=OLD.id;
    RETURN OLD;
  END IF;

  SELECT project_id INTO v_project FROM public.booths WHERE id = NEW.booth_id;

  -- Auto-compute status
  v_status := public.compute_payment_status(NEW.amount, NEW.received_amount, NEW.due_date, NEW.status);

  -- Map nature based on payment type
  v_nature := CASE NEW.type
    WHEN 'extra' THEN 'extra_charge'
    WHEN 'reimburse_charge' THEN 'reimbursable'
    ELSE 'contract'
  END;

  INSERT INTO public.transactions (
    date, project_id, booth_id, type, nature, category, subcategory,
    amount, status, due_date, paid_date, invoice_number, receipt_url, notes,
    source_table, source_id
  ) VALUES (
    COALESCE(NEW.invoice_date, NEW.received_date, to_char(now(), 'YYYY-MM-DD')),
    v_project, NEW.booth_id, 'income', v_nature,
    'payment', NEW.type, NEW.amount,
    CASE v_status
      WHEN 'received' THEN 'paid'
      WHEN 'partial' THEN 'partial_paid'
      WHEN 'overdue' THEN 'overdue'
      WHEN 'invoiced' THEN 'invoiced'
      ELSE 'draft'
    END,
    NEW.due_date, NEW.received_date, NEW.invoice_number, NEW.document_url,
    COALESCE(NEW.notes, '') || CASE WHEN NEW.follow_up_notes IS NOT NULL THEN E'\n[跟进] '||NEW.follow_up_notes ELSE '' END,
    'payments', NEW.id
  )
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    date = EXCLUDED.date, project_id = EXCLUDED.project_id, booth_id = EXCLUDED.booth_id,
    nature = EXCLUDED.nature, subcategory = EXCLUDED.subcategory,
    amount = EXCLUDED.amount, status = EXCLUDED.status,
    due_date = EXCLUDED.due_date, paid_date = EXCLUDED.paid_date,
    invoice_number = EXCLUDED.invoice_number,
    receipt_url = EXCLUDED.receipt_url, notes = EXCLUDED.notes;

  RETURN NEW;
END;
$function$;

-- Expense sync (use new reimburse_status)
CREATE OR REPLACE FUNCTION public.sync_expense_to_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  BEGIN
    v_paid_by_uuid := NEW.paid_by::uuid;
  EXCEPTION WHEN others THEN
    v_paid_by_uuid := NULL;
  END;

  IF NEW.user_id IS NOT NULL THEN
    v_type := 'reimbursable';
    v_nature := 'reimbursable';
    v_status := COALESCE(NEW.reimburse_status,
      CASE WHEN NEW.reimbursed THEN 'recovered' ELSE 'not_billed' END);
  ELSE
    v_type := 'expense';
    v_nature := 'cost';
    v_status := CASE WHEN NEW.paid_date IS NOT NULL THEN 'paid' ELSE 'unpaid' END;
  END IF;

  INSERT INTO public.transactions (
    date, project_id, booth_id, client_id, vendor_name, type, nature,
    category, subcategory, amount, paid_by_user_id, owed_to_user_id,
    status, due_date, paid_date, receipt_url, notes, source_table, source_id
  ) VALUES (
    NEW.date, NEW.project_id, NEW.booth_id, NEW.client_id,
    COALESCE(NEW.vendor_name, NEW.paid_by), v_type, v_nature,
    NEW.main_category, NEW.sub_category, NEW.amount,
    COALESCE(v_paid_by_uuid, NEW.user_id), NEW.user_id,
    v_status, NEW.due_date, NEW.paid_date, NEW.receipt_url, NEW.description,
    'expenses', NEW.id
  )
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    date = EXCLUDED.date, project_id = EXCLUDED.project_id, booth_id = EXCLUDED.booth_id,
    client_id = EXCLUDED.client_id, vendor_name = EXCLUDED.vendor_name,
    type = EXCLUDED.type, nature = EXCLUDED.nature,
    category = EXCLUDED.category, subcategory = EXCLUDED.subcategory,
    amount = EXCLUDED.amount, paid_by_user_id = EXCLUDED.paid_by_user_id,
    owed_to_user_id = EXCLUDED.owed_to_user_id, status = EXCLUDED.status,
    due_date = EXCLUDED.due_date, paid_date = EXCLUDED.paid_date,
    receipt_url = EXCLUDED.receipt_url, notes = EXCLUDED.notes;

  RETURN NEW;
END;
$function$;

-- Work log sync (use payment_status)
CREATE OR REPLACE FUNCTION public.sync_worklog_to_transaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_amount NUMERIC;
  v_status TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.transactions WHERE source_table='work_logs' AND source_id=OLD.id;
    RETURN OLD;
  END IF;

  v_amount := CASE
    WHEN NEW.rate_type = 'hourly' THEN COALESCE(NEW.hours, 0) * NEW.daily_rate
    ELSE NEW.daily_rate
  END;

  v_status := CASE
    WHEN NEW.paid_amount >= v_amount AND v_amount > 0 THEN 'paid'
    WHEN NEW.paid_amount > 0 THEN 'partial_paid'
    ELSE 'unpaid'
  END;

  INSERT INTO public.transactions (
    date, project_id, booth_id, employee_id, type, nature,
    category, subcategory, amount, owed_to_user_id, paid_by_user_id,
    status, paid_date, notes, source_table, source_id
  ) VALUES (
    NEW.date, NEW.project_id, NEW.booth_id, NEW.auth_user_id, 'payroll', 'payroll',
    '人工', NEW.rate_type, v_amount, NEW.auth_user_id, NEW.paid_by_user_id,
    v_status, NEW.paid_date, NEW.user_name, 'work_logs', NEW.id
  )
  ON CONFLICT (source_table, source_id) DO UPDATE SET
    date = EXCLUDED.date, project_id = EXCLUDED.project_id, booth_id = EXCLUDED.booth_id,
    employee_id = EXCLUDED.employee_id, subcategory = EXCLUDED.subcategory,
    amount = EXCLUDED.amount, owed_to_user_id = EXCLUDED.owed_to_user_id,
    paid_by_user_id = EXCLUDED.paid_by_user_id, status = EXCLUDED.status,
    paid_date = EXCLUDED.paid_date, notes = EXCLUDED.notes;

  RETURN NEW;
END;
$function$;

-- Re-sync existing data through triggers
UPDATE public.payments SET amount = amount;
UPDATE public.expenses SET amount = amount;
UPDATE public.work_logs SET daily_rate = daily_rate;