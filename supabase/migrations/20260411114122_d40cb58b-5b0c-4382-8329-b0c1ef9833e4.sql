
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS reimbursed boolean NOT NULL DEFAULT false;
