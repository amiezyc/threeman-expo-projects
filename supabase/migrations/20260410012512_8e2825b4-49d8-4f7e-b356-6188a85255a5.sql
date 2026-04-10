CREATE UNIQUE INDEX idx_expenses_auto_labor_unique 
ON public.expenses (project_id, sub_category) 
WHERE sub_category LIKE 'auto:%';