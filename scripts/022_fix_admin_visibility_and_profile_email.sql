-- Fix admin visibility and add email to profiles; safe to run multiple times

-- 1) Ensure profiles.email exists and is populated from auth.users
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id
  AND (p.email IS NULL OR p.email = '');

-- 2) Add an explicit FK from accounts.user_id -> profiles.id to enable nested selects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'accounts_user_id_profiles_fk'
  ) THEN
    ALTER TABLE public.accounts
      ADD CONSTRAINT accounts_user_id_profiles_fk
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 3) Recreate admin-friendly SELECT policies to ensure admins can see all rows
-- Profiles
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'admin_all_access') THEN
    DROP POLICY "admin_all_access" ON public.profiles;
  END IF;
END $$;

CREATE POLICY "admin_all_access" ON public.profiles FOR ALL
  USING (
    (current_setting('request.jwt.claims', true))::json ->> 'role' = 'admin'
    OR coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
  );

-- Accounts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'accounts' AND policyname = 'admin_accounts_access') THEN
    DROP POLICY "admin_accounts_access" ON public.accounts;
  END IF;
END $$;

CREATE POLICY "admin_accounts_access" ON public.accounts FOR ALL
  USING (
    (current_setting('request.jwt.claims', true))::json ->> 'role' = 'admin'
    OR coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
  );

-- Transactions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'admin_transactions_access') THEN
    DROP POLICY "admin_transactions_access" ON public.transactions;
  END IF;
END $$;

CREATE POLICY "admin_transactions_access" ON public.transactions FOR ALL
  USING (
    (current_setting('request.jwt.claims', true))::json ->> 'role' = 'admin'
    OR coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
  );

-- Pending transactions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pending_transactions' AND policyname = 'admin_pending_transactions_access') THEN
    DROP POLICY "admin_pending_transactions_access" ON public.pending_transactions;
  END IF;
END $$;

CREATE POLICY "admin_pending_transactions_access" ON public.pending_transactions FOR ALL
  USING (
    (current_setting('request.jwt.claims', true))::json ->> 'role' = 'admin'
    OR coalesce(((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin')::boolean, false) = true
  );

-- 4) Ensure handle_new_user() also sets email (if another script hasn't already)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, address)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data ->> 'full_name', 'New User'),
    coalesce(NEW.raw_user_meta_data ->> 'phone', null),
    coalesce(NEW.raw_user_meta_data ->> 'address', null)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.accounts (user_id, account_number, account_type, balance)
  VALUES (
    NEW.id,
    'ACC-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
    'checking',
    0.00
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;





