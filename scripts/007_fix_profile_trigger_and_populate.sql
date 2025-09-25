-- Fix the profile trigger to include email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert profile with email
  insert into public.profiles (id, email, full_name, phone, address)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'New User'),
    coalesce(new.raw_user_meta_data ->> 'phone', null),
    coalesce(new.raw_user_meta_data ->> 'address', null)
  )
  on conflict (id) do nothing;

  -- Create default checking account
  insert into public.accounts (user_id, account_number, account_type, balance)
  values (
    new.id, 
    'ACC-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
    'checking', 
    0.00
  )
  on conflict do nothing;

  return new;
end;
$$;

-- Populate profiles for existing users who don't have them
INSERT INTO public.profiles (id, email, full_name, phone, address)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data ->> 'full_name', 'Existing User'),
  au.raw_user_meta_data ->> 'phone',
  au.raw_user_meta_data ->> 'address'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Create accounts for users who don't have them
INSERT INTO public.accounts (user_id, account_number, account_type, balance)
SELECT 
  p.id,
  'ACC-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  'checking',
  0.00
FROM public.profiles p
LEFT JOIN public.accounts a ON p.id = a.user_id
WHERE a.user_id IS NULL;
