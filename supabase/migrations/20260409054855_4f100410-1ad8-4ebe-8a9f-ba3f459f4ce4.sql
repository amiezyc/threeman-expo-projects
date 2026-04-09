
-- 1. Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  name text NOT NULL DEFAULT '',
  daily_rate numeric DEFAULT 250,
  hourly_rate numeric DEFAULT NULL,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Security definer function to get role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

-- 3. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. Add user_id columns to existing tables
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.work_logs ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

-- 6. Profiles RLS
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 7. Drop existing permissive policies and replace with role-based ones

-- Projects
DROP POLICY IF EXISTS "Allow all on projects" ON public.projects;
CREATE POLICY "Admin full access on projects"
  ON public.projects FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Employee read projects"
  ON public.projects FOR SELECT TO authenticated
  USING (true);

-- Booths
DROP POLICY IF EXISTS "Allow all on booths" ON public.booths;
CREATE POLICY "Admin full access on booths"
  ON public.booths FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Employee read booths"
  ON public.booths FOR SELECT TO authenticated
  USING (true);

-- Expenses
DROP POLICY IF EXISTS "Allow all on expenses" ON public.expenses;
CREATE POLICY "Admin full access on expenses"
  ON public.expenses FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Employee manage own expenses"
  ON public.expenses FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Work logs
DROP POLICY IF EXISTS "Allow all on work_logs" ON public.work_logs;
CREATE POLICY "Admin full access on work_logs"
  ON public.work_logs FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Employee manage own work_logs"
  ON public.work_logs FOR ALL TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Payments
DROP POLICY IF EXISTS "Allow all on payments" ON public.payments;
CREATE POLICY "Admin full access on payments"
  ON public.payments FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Employee read payments"
  ON public.payments FOR SELECT TO authenticated
  USING (true);

-- Partner shares
DROP POLICY IF EXISTS "Allow all on partner_shares" ON public.partner_shares;
CREATE POLICY "Admin full access on partner_shares"
  ON public.partner_shares FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Employee read partner_shares"
  ON public.partner_shares FOR SELECT TO authenticated
  USING (true);

-- Employees table - keep for now but restrict
DROP POLICY IF EXISTS "Allow all on employees" ON public.employees;
CREATE POLICY "Admin full access on employees"
  ON public.employees FOR ALL TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin')
  WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Employee read employees"
  ON public.employees FOR SELECT TO authenticated
  USING (true);
