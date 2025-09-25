-- Create profiles table that references auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  address text,
  role text default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create accounts table for banking functionality
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_number text unique not null default 'ACC-' || substr(gen_random_uuid()::text, 1, 8),
  account_type text not null default 'checking' check (account_type in ('checking', 'savings')),
  balance decimal(15,2) not null default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create transactions table for audit trail
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  amount decimal(15,2) not null,
  transaction_type text not null check (transaction_type in ('deposit', 'withdrawal', 'transfer', 'admin_adjustment')),
  description text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;

-- RLS Policies for profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  using (auth.uid() = id);

-- RLS Policies for accounts
create policy "accounts_select_own"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "accounts_insert_own"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "accounts_update_own"
  on public.accounts for update
  using (auth.uid() = user_id);

-- RLS Policies for transactions
create policy "transactions_select_own"
  on public.transactions for select
  using (
    exists (
      select 1 from public.accounts 
      where accounts.id = transactions.account_id 
      and accounts.user_id = auth.uid()
    )
  );

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (
    exists (
      select 1 from public.accounts 
      where accounts.id = transactions.account_id 
      and accounts.user_id = auth.uid()
    )
  );
