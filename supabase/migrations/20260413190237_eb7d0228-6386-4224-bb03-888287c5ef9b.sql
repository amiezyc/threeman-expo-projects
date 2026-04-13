
-- Create expense_categories table for customizable categories
CREATE TABLE public.expense_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  parent_id uuid REFERENCES public.expense_categories(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON public.expense_categories FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin full access on expense_categories"
  ON public.expense_categories FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- Add unit_price and weight to expenses
ALTER TABLE public.expenses ADD COLUMN unit_price numeric;
ALTER TABLE public.expenses ADD COLUMN weight numeric;

-- Seed default categories
INSERT INTO public.expense_categories (id, name, parent_id, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', '差旅', NULL, 1),
  ('a0000000-0000-0000-0000-000000000002', '物料', NULL, 2),
  ('a0000000-0000-0000-0000-000000000003', '人工', NULL, 3),
  ('a0000000-0000-0000-0000-000000000004', '三方', NULL, 4),
  ('a0000000-0000-0000-0000-000000000005', '电费', NULL, 5),
  ('a0000000-0000-0000-0000-000000000006', '其他', NULL, 6);

INSERT INTO public.expense_categories (name, parent_id, sort_order) VALUES
  ('Airbnb', 'a0000000-0000-0000-0000-000000000001', 1),
  ('Flight', 'a0000000-0000-0000-0000-000000000001', 2),
  ('Hotel', 'a0000000-0000-0000-0000-000000000001', 3),
  ('Uber', 'a0000000-0000-0000-0000-000000000001', 4),
  ('Gas', 'a0000000-0000-0000-0000-000000000001', 5),
  ('Parking', 'a0000000-0000-0000-0000-000000000001', 6),
  ('餐補', 'a0000000-0000-0000-0000-000000000001', 7),
  ('租車', 'a0000000-0000-0000-0000-000000000001', 8),
  ('Walmart', 'a0000000-0000-0000-0000-000000000001', 9),
  ('Amazon', 'a0000000-0000-0000-0000-000000000002', 1),
  ('画面', 'a0000000-0000-0000-0000-000000000002', 2),
  ('铝合金备料', 'a0000000-0000-0000-0000-000000000002', 3),
  ('地毯', 'a0000000-0000-0000-0000-000000000002', 4),
  ('桌椅', 'a0000000-0000-0000-0000-000000000002', 5),
  ('电视', 'a0000000-0000-0000-0000-000000000002', 6),
  ('其他物料', 'a0000000-0000-0000-0000-000000000002', 7),
  ('日薪', 'a0000000-0000-0000-0000-000000000003', 1),
  ('人工搭建', 'a0000000-0000-0000-0000-000000000003', 2),
  ('撤展', 'a0000000-0000-0000-0000-000000000003', 3),
  ('吊顶', 'a0000000-0000-0000-0000-000000000004', 1),
  ('劳工', 'a0000000-0000-0000-0000-000000000004', 2),
  ('过磅', 'a0000000-0000-0000-0000-000000000004', 3),
  ('其他三方', 'a0000000-0000-0000-0000-000000000004', 4),
  ('电费', 'a0000000-0000-0000-0000-000000000005', 1),
  ('其他电费', 'a0000000-0000-0000-0000-000000000005', 2),
  ('其他', 'a0000000-0000-0000-0000-000000000006', 1);
