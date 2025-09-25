-- Admin OTP System Setup
-- This script sets up the admin OTP system with code 453897

-- 1. Create function to generate admin OTP (your code: 453897)
CREATE OR REPLACE FUNCTION public.generate_admin_otp()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Your admin OTP code
  RETURN '453897';
END;
$$;

-- 2. Create pending_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pending_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  amount decimal(15,2) NOT NULL,
  transaction_type text NOT NULL,
  description text,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on pending_transactions
ALTER TABLE public.pending_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for pending_transactions (users can only see their own)
CREATE POLICY "pending_transactions_select_own" ON public.pending_transactions
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM public.accounts 
      WHERE user_id = auth.uid()
    )
  );

-- 5. Create policy for admins to see all pending transactions
CREATE POLICY "pending_transactions_admin_select" ON public.pending_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (
        raw_user_meta_data ->> 'role' = 'admin' 
        OR raw_user_meta_data ->> 'is_admin' = 'true'
      )
    )
  );

-- 6. Update create_pending_transaction function to use admin OTP
CREATE OR REPLACE FUNCTION public.create_pending_transaction(
  p_account_id uuid,
  p_amount decimal(15,2),
  p_transaction_type text,
  p_description text default null
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance decimal(15,2);
  new_balance decimal(15,2);
  pending_id uuid;
  admin_otp text;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.accounts
  WHERE id = p_account_id;

  IF current_balance IS NULL THEN
    RETURN json_build_object('status', 'error', 'message', 'Account not found');
  END IF;

  -- Calculate new balance
  new_balance := current_balance + p_amount;

  -- Check if withdrawal would cause negative balance
  IF new_balance < 0 THEN
    RETURN json_build_object('status', 'error', 'message', 'Insufficient funds');
  END IF;

  -- Generate admin OTP (your code: 453897)
  admin_otp := public.generate_admin_otp();

  -- Create pending transaction
  INSERT INTO public.pending_transactions (account_id, amount, transaction_type, description, otp_code, expires_at)
  VALUES (p_account_id, p_amount, p_transaction_type, p_description, admin_otp, NOW() + INTERVAL '10 minutes')
  RETURNING id INTO pending_id;

  RETURN json_build_object(
    'status', 'requires_otp',
    'pending_id', pending_id,
    'otp_code', admin_otp
  );
END;
$$;

-- 7. Create function to verify OTP and complete transaction
CREATE OR REPLACE FUNCTION public.verify_otp_and_complete(
  p_pending_id uuid,
  p_otp_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pending_record record;
  new_balance decimal(15,2);
BEGIN
  -- Get pending transaction
  SELECT * INTO pending_record
  FROM public.pending_transactions
  WHERE id = p_pending_id;

  IF pending_record IS NULL THEN
    RETURN json_build_object('status', 'error', 'message', 'Transaction not found');
  END IF;

  -- Check if expired
  IF pending_record.expires_at < NOW() THEN
    RETURN json_build_object('status', 'error', 'message', 'OTP has expired');
  END IF;

  -- Verify OTP code
  IF pending_record.otp_code != p_otp_code THEN
    RETURN json_build_object('status', 'error', 'message', 'Invalid OTP code');
  END IF;

  -- Update account balance
  UPDATE public.accounts
  SET balance = balance + pending_record.amount,
      updated_at = NOW()
  WHERE id = pending_record.account_id
  RETURNING balance INTO new_balance;

  -- Create transaction record
  INSERT INTO public.transactions (
    account_id,
    amount,
    transaction_type,
    description,
    balance_after,
    created_at
  ) VALUES (
    pending_record.account_id,
    pending_record.amount,
    pending_record.transaction_type,
    pending_record.description,
    new_balance,
    NOW()
  );

  -- Delete pending transaction
  DELETE FROM public.pending_transactions WHERE id = p_pending_id;

  RETURN json_build_object(
    'status', 'completed',
    'new_balance', new_balance,
    'message', 'Transaction completed successfully'
  );
END;
$$;

-- 8. Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_admin_otp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_pending_transaction(uuid, decimal, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_otp_and_complete(uuid, text) TO authenticated;

-- 9. Grant table permissions
GRANT SELECT, INSERT, DELETE ON public.pending_transactions TO authenticated;
