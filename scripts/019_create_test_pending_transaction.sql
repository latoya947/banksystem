-- Create a test pending transaction for admin testing
-- This will create a pending withdrawal that requires admin approval

-- First, get a user account (replace with actual account ID from your database)
DO $$
DECLARE
  test_account_id uuid;
  test_user_id uuid;
BEGIN
  -- Get the first account and user for testing
  SELECT id, user_id INTO test_account_id, test_user_id
  FROM public.accounts 
  LIMIT 1;
  
  IF test_account_id IS NOT NULL THEN
    -- Create a test pending transaction (large withdrawal requiring approval)
    INSERT INTO public.pending_transactions (
      account_id, 
      amount, 
      transaction_type, 
      description, 
      requested_by,
      status
    ) VALUES (
      test_account_id,
      -1500.00,  -- Large withdrawal amount
      'withdrawal',
      'Test withdrawal for admin approval - $1500',
      test_user_id,
      'pending'
    );
    
    RAISE NOTICE 'Test pending transaction created for account %', test_account_id;
  ELSE
    RAISE NOTICE 'No accounts found to create test transaction';
  END IF;
END $$;

