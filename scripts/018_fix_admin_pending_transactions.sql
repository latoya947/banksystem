-- Fix admin access to pending_transactions for approval/rejection
-- This ensures admins can update pending transaction status

-- First, ensure the admin update policy exists
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

-- Also ensure admins can SELECT all pending transactions (not just their own)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pending_transactions'
      AND policyname = 'pending_transactions_admin_select'
  ) THEN
    CREATE POLICY "pending_transactions_admin_select"
      ON public.pending_transactions FOR SELECT
      USING (
        (
          (coalesce((current_setting('request.jwt.claims', true))::json ->> 'role', '') = 'admin') OR
          (coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'role'), '') = 'admin') OR
          (coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin'), 'false') = 'true')
        ) OR
        (
          auth.uid() = requested_by OR
          EXISTS (
            SELECT 1 FROM public.accounts 
            WHERE accounts.id = pending_transactions.account_id 
            AND accounts.user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.pending_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_account_balance TO authenticated;


