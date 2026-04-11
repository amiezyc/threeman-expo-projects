
-- Add must_change_password to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_user_id uuid,
  performed_by uuid,
  details jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admin read audit_logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- Service role inserts (no INSERT policy for authenticated users - edge functions use service_role)
