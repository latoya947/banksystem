-- Allow admins to update pending_transactions (approve/reject)

ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;

-- Create admin update policy using JWT claims
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pending_transactions'
      AND policyname = 'pending_transactions_admin_update'
  ) THEN
    CREATE POLICY "pending_transactions_admin_update"
      ON public.pending_transactions FOR UPDATE
      USING (
        (
          (coalesce((current_setting('request.jwt.claims', true))::json ->> 'role', '') = 'admin') OR
          (coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'role'), '') = 'admin') OR
          (coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin'), 'false') = 'true')
        )
      )
      WITH CHECK (
        (
          (coalesce((current_setting('request.jwt.claims', true))::json ->> 'role', '') = 'admin') OR
          (coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'role'), '') = 'admin') OR
          (coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin'), 'false') = 'true')
        )
      );
  END IF;
END $$;

GRANT UPDATE ON public.pending_transactions TO authenticated;


