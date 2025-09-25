-- Auto-create profile and default account when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert profile (non-destructive). Only creates if missing; never updates existing rows.
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
  insert into public.accounts (user_id, account_type, balance)
  values (new.id, 'checking', 0.00)
  on conflict do nothing;

  return new;
end;
$$;

-- Create trigger only if it doesn't already exist (non-destructive)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
      AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
