-- Create admin role policies for managing user accounts
-- Admins can view and update all accounts and transactions

-- Grant execute permission on the update_account_balance function to authenticated users
-- (The function itself checks for admin role)
GRANT EXECUTE ON FUNCTION public.update_account_balance TO authenticated;

-- Admin policies for profiles (admins can view all profiles)
create policy "profiles_admin_select"
  on public.profiles for select
  using (
    exists (
      select 1 from auth.users 
      where auth.users.id = auth.uid() 
      and auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- Admin policies for accounts (admins can view and update all accounts)
create policy "accounts_admin_select"
  on public.accounts for select
  using (
    exists (
      select 1 from auth.users 
      where auth.users.id = auth.uid() 
      and auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

create policy "accounts_admin_update"
  on public.accounts for update
  using (
    exists (
      select 1 from auth.users 
      where auth.users.id = auth.uid() 
      and auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

-- Admin policies for transactions (admins can view all and create admin adjustments)
create policy "transactions_admin_select"
  on public.transactions for select
  using (
    exists (
      select 1 from auth.users 
      where auth.users.id = auth.uid() 
      and auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
  );

create policy "transactions_admin_insert"
  on public.transactions for insert
  with check (
    exists (
      select 1 from auth.users 
      where auth.users.id = auth.uid() 
      and auth.users.raw_user_meta_data ->> 'role' = 'admin'
    )
    and transaction_type = 'admin_adjustment'
  );
