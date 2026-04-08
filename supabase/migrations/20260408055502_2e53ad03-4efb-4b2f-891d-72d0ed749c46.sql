
ALTER TABLE public.work_logs ADD COLUMN rate_type TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE public.work_logs ADD COLUMN hours NUMERIC DEFAULT NULL;
ALTER TABLE public.employees ADD COLUMN hourly_rate NUMERIC DEFAULT NULL;
