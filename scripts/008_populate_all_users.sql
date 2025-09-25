-- First, let's see what users exist in auth.users but not in profiles
DO $$
DECLARE
    user_record RECORD;
    account_number TEXT;
BEGIN
    -- Insert all auth users into profiles if they don't exist
    INSERT INTO profiles (id, email, full_name, is_admin)
    SELECT 
        au.id,
        au.email,
        COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
        CASE 
            WHEN au.raw_user_meta_data->>'is_admin' = 'true' THEN true
            WHEN au.raw_user_meta_data->>'role' = 'admin' THEN true
            ELSE false
        END as is_admin
    FROM auth.users au
    WHERE au.id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL);

    -- Create accounts for users who don't have any
    FOR user_record IN 
        SELECT p.id, p.email 
        FROM profiles p 
        WHERE p.id NOT IN (SELECT DISTINCT user_id FROM accounts WHERE user_id IS NOT NULL)
    LOOP
        -- Generate account number
        account_number := 'ACC' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- Insert checking account
        INSERT INTO accounts (user_id, account_number, account_type, balance)
        VALUES (user_record.id, account_number, 'checking', 1000.00);
        
        -- Log the account creation
        INSERT INTO transactions (account_id, amount, transaction_type, description)
        SELECT id, 1000.00, 'deposit', 'Initial account setup'
        FROM accounts 
        WHERE account_number = account_number;
        
        RAISE NOTICE 'Created account % for user %', account_number, user_record.email;
    END LOOP;
END $$;

-- Verify the results
SELECT 'Profiles created:' as info, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Accounts created:' as info, COUNT(*) as count FROM accounts
UNION ALL
SELECT 'Admin users:' as info, COUNT(*) as count FROM profiles WHERE is_admin = true;
