-- Allow admins to view all rows in pending_transactions
-- This complements existing user-level policies so admins can review/approve

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;

-- Create or replace an admin-select policy
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
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND (
            raw_user_meta_data ->> 'role' = 'admin' 
            OR raw_user_meta_data ->> 'is_admin' = 'true'
          )
        )
      );
  END IF;
END $$;

-- Optional: ensure authenticated can select if allowed by policies
GRANT SELECT ON public.pending_transactions TO authenticated;


