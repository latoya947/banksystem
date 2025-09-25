-- Function to safely update account balance with transaction logging
create or replace function public.update_account_balance(
  account_uuid uuid,
  amount_change decimal(15,2),
  transaction_description text default null,
  admin_user_id uuid default null
)
returns json
language plpgsql
security definer
as $$
declare
  current_balance decimal(15,2);
  new_balance decimal(15,2);
  transaction_type_val text;
  result json;
begin
  -- Get current balance
  select balance into current_balance
  from public.accounts
  where id = account_uuid;

  if current_balance is null then
    return json_build_object('success', false, 'error', 'Account not found');
  end if;

  -- Calculate new balance
  new_balance := current_balance + amount_change;

  -- Prevent negative balances for regular users
  if new_balance < 0 and admin_user_id is null then
    return json_build_object('success', false, 'error', 'Insufficient funds');
  end if;

  -- Determine transaction type
  if admin_user_id is not null then
    transaction_type_val := 'admin_adjustment';
  elsif amount_change > 0 then
    transaction_type_val := 'deposit';
  else
    transaction_type_val := 'withdrawal';
  end if;

  -- Update account balance
  update public.accounts
  set balance = new_balance,
      updated_at = now()
  where id = account_uuid;

  -- Log transaction
  insert into public.transactions (account_id, amount, transaction_type, description, created_by)
  values (
    account_uuid,
    amount_change,
    transaction_type_val,
    coalesce(transaction_description, transaction_type_val),
    coalesce(admin_user_id, auth.uid())
  );

  return json_build_object(
    'success', true,
    'old_balance', current_balance,
    'new_balance', new_balance,
    'amount_change', amount_change
  );
end;
$$;
