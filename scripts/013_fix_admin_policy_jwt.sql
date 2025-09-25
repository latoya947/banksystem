-- Fix admin policy: avoid selecting from auth.users inside RLS policy
-- Replace policy to check admin via JWT claims (role/is_admin) to prevent permission errors

-- Drop existing admin policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pending_transactions'
      AND policyname = 'pending_transactions_admin_select'
  ) THEN
    EXECUTE 'DROP POLICY "pending_transactions_admin_select" ON public.pending_transactions';
  END IF;
END $$;

-- Create new admin select policy using JWT claims
CREATE POLICY "pending_transactions_admin_select"
  ON public.pending_transactions FOR SELECT
  USING (
    (
      -- Check role claim or is_admin flag in JWT metadata
      (coalesce((current_setting('request.jwt.claims', true))::json ->> 'role', '') = 'admin')
      OR
      (coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'role'), '') = 'admin')
      OR
      (coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin'), 'false') = 'true')
    )
  );


