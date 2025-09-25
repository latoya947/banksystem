-- Migrate admin adjustments to use transaction_type = 'balance_change'
-- 1) Replace the transactions.transaction_type CHECK constraint to include 'balance_change'
-- 2) Update update_account_balance() to log admin actions as 'balance_change'

-- 1) Drop existing CHECK constraint on transactions.transaction_type and recreate it
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.transactions'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%transaction_type%check%in%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.transactions DROP CONSTRAINT %I', constraint_name);
  END IF;

  -- Add the new constraint with a stable name
  EXECUTE $$
    ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_transaction_type_check
    CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'balance_change'))
  $$;
END $$;

-- 2) Update function to use 'balance_change' when admin_user_id is provided
CREATE OR REPLACE FUNCTION public.update_account_balance(
  account_uuid uuid,
  amount_change decimal(15,2),
  transaction_description text DEFAULT NULL,
  admin_user_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance decimal(15,2);
  new_balance decimal(15,2);
  transaction_type_val text;
  result json;
BEGIN
  -- Get current balance
  SELECT balance INTO current_balance
  FROM public.accounts
  WHERE id = account_uuid;

  IF current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Account not found');
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


