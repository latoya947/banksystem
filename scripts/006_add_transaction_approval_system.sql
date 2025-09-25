-- Add transaction approval and OTP system
-- Add status and OTP fields to transactions table
alter table public.transactions 
add column if not exists status text not null default 'completed' check (status in ('pending', 'completed', 'rejected', 'requires_otp')),
add column if not exists otp_code text,
add column if not exists otp_expires_at timestamp with time zone,
add column if not exists approved_by uuid references auth.users(id),
add column if not exists approved_at timestamp with time zone,
add column if not exists rejection_reason text;

-- Create pending_transactions table for transactions awaiting approval
create table if not exists public.pending_transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  amount decimal(15,2) not null,
  transaction_type text not null check (transaction_type in ('deposit', 'withdrawal', 'transfer', 'admin_adjustment')),
  description text,
  requested_by uuid not null references auth.users(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'requires_otp')),
  otp_code text,
  otp_expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for pending_transactions
alter table public.pending_transactions enable row level security;

-- RLS Policies for pending_transactions
create policy "pending_transactions_select_own"
  on public.pending_transactions for select
  using (
    auth.uid() = requested_by or
    exists (
      select 1 from public.accounts 
      where accounts.id = pending_transactions.account_id 
      and accounts.user_id = auth.uid()
    )
  );

create policy "pending_transactions_insert_own"
  on public.pending_transactions for insert
  with check (auth.uid() = requested_by);

-- Function to generate OTP
create or replace function generate_otp()
returns text
language plpgsql
security definer
as $$
begin
  return lpad(floor(random() * 1000000)::text, 6, '0');
end;
$$;

-- Function to create pending transaction with risk assessment
create or replace function create_pending_transaction(
  p_account_id uuid,
  p_amount decimal,
  p_transaction_type text,
  p_description text default null
)
returns json
language plpgsql
security definer
as $$
declare
  v_account_balance decimal;
  v_daily_total decimal;
  v_requires_approval boolean := false;
  v_requires_otp boolean := false;
  v_pending_id uuid;
  v_otp_code text;
begin
  -- Get current account balance
  select balance into v_account_balance
  from public.accounts
  where id = p_account_id;

  -- Check daily transaction total
  select coalesce(sum(abs(amount)), 0) into v_daily_total
  from public.transactions
  where account_id = p_account_id
  and created_at >= current_date
  and transaction_type in ('withdrawal', 'transfer');

  -- Risk assessment rules
  if p_transaction_type in ('withdrawal', 'transfer') then
    -- Large amount (over $1000) requires approval
    if abs(p_amount) > 1000 then
      v_requires_approval := true;
    end if;
    
    -- Daily limit exceeded ($5000) requires approval
    if v_daily_total + abs(p_amount) > 5000 then
      v_requires_approval := true;
    end if;
    
    -- Insufficient funds requires OTP
    if p_amount < 0 and v_account_balance + p_amount < 0 then
      v_requires_otp := true;
    end if;
    
    -- Suspicious pattern (multiple large transactions) requires OTP
    if abs(p_amount) > 500 and v_daily_total > 2000 then
      v_requires_otp := true;
    end if;
  end if;

  -- If no special handling needed, process immediately
  if not v_requires_approval and not v_requires_otp then
    -- Process transaction immediately using existing function
    perform update_account_balance(p_account_id, p_amount, p_description, p_transaction_type);
    return json_build_object(
      'status', 'completed',
      'message', 'Transaction completed successfully'
    );
  end if;

  -- Generate OTP if required
  if v_requires_otp then
    v_otp_code := generate_otp();
  end if;

  -- Create pending transaction
  insert into public.pending_transactions (
    account_id, amount, transaction_type, description, requested_by,
    status, otp_code, otp_expires_at
  ) values (
    p_account_id, p_amount, p_transaction_type, p_description, auth.uid(),
    case when v_requires_otp then 'requires_otp' else 'pending' end,
    v_otp_code,
    case when v_requires_otp then now() + interval '10 minutes' else null end
  ) returning id into v_pending_id;

  -- Return appropriate response
  if v_requires_otp then
    return json_build_object(
      'status', 'requires_otp',
      'pending_id', v_pending_id,
      'otp_code', v_otp_code,
      'message', 'Transaction requires OTP verification. Code expires in 10 minutes.'
    );
  else
    return json_build_object(
      'status', 'pending_approval',
      'pending_id', v_pending_id,
      'message', 'Transaction submitted for approval due to amount or daily limits.'
    );
  end if;
end;
$$;

-- Function to verify OTP and complete transaction
create or replace function verify_otp_and_complete(
  p_pending_id uuid,
  p_otp_code text
)
returns json
language plpgsql
security definer
as $$
declare
  v_pending_transaction record;
begin
  -- Get pending transaction
  select * into v_pending_transaction
  from public.pending_transactions
  where id = p_pending_id
  and requested_by = auth.uid()
  and status = 'requires_otp';

  if not found then
    return json_build_object(
      'status', 'error',
      'message', 'Pending transaction not found or not accessible'
    );
  end if;

  -- Check if OTP expired
  if v_pending_transaction.otp_expires_at < now() then
    return json_build_object(
      'status', 'error',
      'message', 'OTP has expired. Please request a new transaction.'
    );
  end if;

  -- Verify OTP
  if v_pending_transaction.otp_code != p_otp_code then
    return json_build_object(
      'status', 'error',
      'message', 'Invalid OTP code'
    );
  end if;

  -- Process the transaction
  perform update_account_balance(
    v_pending_transaction.account_id,
    v_pending_transaction.amount,
    v_pending_transaction.description,
    v_pending_transaction.transaction_type
  );

  -- Update pending transaction status
  update public.pending_transactions
  set status = 'approved'
  where id = p_pending_id;

  return json_build_object(
    'status', 'completed',
    'message', 'Transaction completed successfully'
  );
end;
$$;
