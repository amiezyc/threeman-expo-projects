
-- Employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  daily_rate NUMERIC DEFAULT 250,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Partner shares
CREATE TABLE public.partner_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  percentage NUMERIC NOT NULL DEFAULT 0
);

-- Booths table
CREATE TABLE public.booths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  client_name TEXT NOT NULL,
  total_contract NUMERIC NOT NULL DEFAULT 0
);

-- Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booth_id UUID REFERENCES public.booths(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'deposit',
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  invoice_date TEXT,
  received_date TEXT,
  notes TEXT
);

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  booth_id UUID REFERENCES public.booths(id) ON DELETE SET NULL,
  paid_by TEXT NOT NULL,
  main_category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL,
  receipt_url TEXT
);

-- Work logs table
CREATE TABLE public.work_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  booth_id UUID REFERENCES public.booths(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  date TEXT NOT NULL,
  daily_rate NUMERIC NOT NULL DEFAULT 250
);

-- Disable RLS for now (no auth yet)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (public app, no auth)
CREATE POLICY "Allow all on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on partner_shares" ON public.partner_shares FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on booths" ON public.booths FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on work_logs" ON public.work_logs FOR ALL USING (true) WITH CHECK (true);
