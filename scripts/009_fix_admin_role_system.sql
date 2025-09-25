-- Script to fix the admin role system and update existing profiles
-- This script should be run after the initial setup

-- Step 1: Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    END IF;
END $$;

-- Step 2: Update existing profiles to have the default role
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- Step 3: Create admin user (replace 'admin@example.com' with actual admin email)
-- First, find the user ID
-- SELECT id, email FROM auth.users WHERE email = 'admin@example.com';

-- Then update the user metadata and profile
-- UPDATE auth.users 
-- SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb), 
--   '{role}', 
--   '"admin"'
-- )
-- WHERE email = 'admin@example.com';

-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- Step 4: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_account_balance TO authenticated;

-- Step 5: Verify the setup
SELECT 
  'Profiles with role field:' as info,
  COUNT(*) as count 
FROM profiles 
WHERE role IS NOT NULL;

SELECT 
  'Admin users:' as info,
  COUNT(*) as count 
FROM profiles 
WHERE role = 'admin';

SELECT 
  'Regular users:' as info,
  COUNT(*) as count 
FROM profiles 
WHERE role = 'user';

-- Step 6: Show current admin users
SELECT 
  p.id,
  p.full_name,
  p.role,
  u.email,
  u.raw_user_meta_data->>'role' as auth_role
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
