-- Ensure gen_random_uuid() is available for account_number default
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Re-assert a safe default for accounts.account_number
ALTER TABLE public.accounts
  ALTER COLUMN account_number SET DEFAULT 'ACC-' || substr(gen_random_uuid()::text, 1, 8);

-- Backfill any existing rows missing account_number
UPDATE public.accounts
SET account_number = 'ACC-' || substr(gen_random_uuid()::text, 1, 8)
WHERE account_number IS NULL;


