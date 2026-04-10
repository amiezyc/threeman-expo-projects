-- Add source_id column for idempotent auto-labor entries
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS source_id text;

-- Backfill source_id from existing auto entries
UPDATE public.expenses 
SET source_id = replace(sub_category, 'auto:', '')
WHERE sub_category LIKE 'auto:%' AND source_id IS NULL;

-- Drop the old partial unique index (replaced by constraint below)
DROP INDEX IF EXISTS idx_expenses_auto_labor_unique;

-- Create a new unique index for UPSERT: one auto-labor entry per user per project
CREATE UNIQUE INDEX idx_expenses_auto_labor_upsert
ON public.expenses (project_id, main_category, source_id)
WHERE source_id IS NOT NULL;