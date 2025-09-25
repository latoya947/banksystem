-- Complete database setup for bank3 application
-- Run this script in your new Supabase SQL editor

-- 1. Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_admin BOOLEAN DEFAULT FALSE,
  is_frozen BOOLEAN DEFAULT FALSE,
  frozen_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create accounts table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'business')),
  balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'balance_change')),
  description TEXT,
  balance_after DECIMAL(15,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create pending_transactions table
CREATE TABLE IF NOT EXISTS public.pending_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'admin_adjustment')),
  description TEXT,
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'requires_otp')),
  otp_code TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 8. Create RLS Policies for accounts
CREATE POLICY "accounts_select_own" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert_own" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. Create RLS Policies for transactions
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.accounts WHERE accounts.id = transactions.account_id AND accounts.user_id = auth.uid()));

-- 10. Create RLS Policies for pending_transactions
CREATE POLICY "pending_transactions_select_own" ON public.pending_transactions FOR SELECT 
  USING (auth.uid() = requested_by OR EXISTS (SELECT 1 FROM public.accounts WHERE accounts.id = pending_transactions.account_id AND accounts.user_id = auth.uid()));

CREATE POLICY "pending_transactions_insert_own" ON public.pending_transactions FOR INSERT 
  WITH CHECK (auth.uid() = requested_by);

-- 11. Admin policies for all tables
CREATE POLICY "admin_all_access" ON public.profiles FOR ALL 
  USING ((current_setting('request.jwt.claims', true))::json ->> 'role' = 'admin' OR 
         ((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin')::boolean = true);

CREATE POLICY "admin_accounts_access" ON public.accounts FOR ALL 
  USING ((current_setting('request.jwt.claims', true))::json ->> 'role' = 'admin' OR 
         ((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin')::boolean = true);

CREATE POLICY "admin_transactions_access" ON public.transactions FOR ALL 
  USING ((current_setting('request.jwt.claims', true))::json ->> 'role' = 'admin' OR 
         ((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin')::boolean = true);

CREATE POLICY "admin_pending_transactions_access" ON public.pending_transactions FOR ALL 
  USING ((current_setting('request.jwt.claims', true))::json ->> 'role' = 'admin' OR 
         ((current_setting('request.jwt.claims', true))::json -> 'user_metadata' ->> 'is_admin')::boolean = true);

-- 12. Create profile trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'address');
  
  -- Create default checking account
  INSERT INTO public.accounts (user_id, account_number, account_type, balance)
  VALUES (NEW.id, 'ACC' || substr(NEW.id::text, 1, 8), 'checking', 1000.00);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Create balance update function
CREATE OR REPLACE FUNCTION public.update_account_balance(
  account_uuid uuid,
  amount_change decimal(15,2),
  transaction_description text default null,
  admin_user_id uuid default null
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance decimal(15,2);
  new_balance decimal(15,2);
  transaction_type_val text;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.accounts
  WHERE id = account_uuid;

  IF current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Account not found');
  END IF;

  -- Only admins can increase balances
  IF amount_change > 0 AND admin_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Only admin can increase balances');
  END IF;

  -- Calculate new balance
  new_balance := current_balance + amount_change;

  -- Prevent negative balances for regular users
  IF new_balance < 0 AND admin_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient funds');
  END IF;

  -- Determine transaction type
  IF admin_user_id IS NOT NULL THEN
    transaction_type_val := 'balance_change';
  ELSIF amount_change > 0 THEN
    transaction_type_val := 'deposit';
  ELSE
    transaction_type_val := 'withdrawal';
  END IF;

  -- Update account balance
  UPDATE public.accounts
  SET balance = new_balance,
      updated_at = now()
  WHERE id = account_uuid;

  -- Log transaction
  INSERT INTO public.transactions (account_id, amount, transaction_type, description, created_by)
  VALUES (
    account_uuid,
    amount_change,
    transaction_type_val,
    coalesce(transaction_description, transaction_type_val),
    coalesce(admin_user_id, auth.uid())
  );

  RETURN json_build_object(
    'success', true,
    'old_balance', current_balance,
    'new_balance', new_balance,
    'amount_change', amount_change
  );
END;
$$;

-- 15. Create pending transaction function
CREATE OR REPLACE FUNCTION public.create_pending_transaction(
  p_account_id uuid,
  p_amount decimal,
  p_transaction_type text,
  p_description text default null
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_balance decimal;
  v_daily_total decimal;
  v_requires_approval boolean := false;
  v_requires_otp boolean := false;
  v_pending_id uuid;
  v_otp_code text;
BEGIN
  -- Get current account balance
  SELECT balance INTO v_account_balance
  FROM public.accounts
  WHERE id = p_account_id;

  -- Check daily transaction total
  SELECT coalesce(sum(abs(amount)), 0) INTO v_daily_total
  FROM public.transactions
  WHERE account_id = p_account_id
  AND created_at >= current_date
  AND transaction_type IN ('withdrawal', 'transfer');

  -- Risk assessment rules
  IF p_transaction_type IN ('withdrawal', 'transfer') THEN
    -- Large amount (over $1000) requires approval
    IF abs(p_amount) > 1000 THEN
      v_requires_approval := true;
    END IF;
    
    -- Daily limit exceeded ($5000) requires approval
    IF v_daily_total + abs(p_amount) > 5000 THEN
      v_requires_approval := true;
    END IF;
    
    -- Insufficient funds requires OTP
    IF p_amount < 0 AND v_account_balance + p_amount < 0 THEN
      v_requires_otp := true;
    END IF;
    
    -- Suspicious pattern (multiple large transactions) requires OTP
    IF abs(p_amount) > 500 AND v_daily_total > 2000 THEN
      v_requires_otp := true;
    END IF;
  END IF;

  -- If no special handling needed, process immediately
  IF NOT v_requires_approval AND NOT v_requires_otp THEN
    -- Process transaction immediately
    PERFORM update_account_balance(p_account_id, p_amount, p_description, p_transaction_type);
    RETURN json_build_object(
      'status', 'completed',
      'message', 'Transaction completed successfully'
    );
  END IF;

  -- Generate OTP if required
  IF v_requires_otp THEN
    v_otp_code := lpad(floor(random() * 1000000)::text, 6, '0');
  END IF;

  -- Create pending transaction
  INSERT INTO public.pending_transactions (
    account_id, amount, transaction_type, description, requested_by,
    status, otp_code, otp_expires_at
  ) VALUES (
    p_account_id, p_amount, p_transaction_type, p_description, auth.uid(),
    CASE WHEN v_requires_otp THEN 'requires_otp' ELSE 'pending' END,
    v_otp_code,
    CASE WHEN v_requires_otp THEN now() + interval '10 minutes' ELSE null END
  ) RETURNING id INTO v_pending_id;

  -- Return appropriate response
  IF v_requires_otp THEN
    RETURN json_build_object(
      'status', 'requires_otp',
      'pending_id', v_pending_id,
      'otp_code', v_otp_code,
      'message', 'Transaction requires OTP verification. Code expires in 10 minutes.'
    );
  ELSE
    RETURN json_build_object(
      'status', 'pending_approval',
      'pending_id', v_pending_id,
      'message', 'Transaction submitted for approval due to amount or daily limits.'
    );
  END IF;
END;
$$;

-- 16. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.accounts TO authenticated;
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.pending_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_account_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pending_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated;

