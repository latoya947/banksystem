-- Script to manually create admin users
-- Replace 'user@example.com' with the actual email of the user you want to make admin

-- Step 1: Find the user ID by email
-- SELECT id, email, raw_user_meta_data FROM auth.users WHERE email = 'user@example.com';

-- Step 2: Update the user's metadata to make them admin
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"admin"'
)
WHERE email = 'user@example.com';

-- Step 3: Update the profile table as well
UPDATE profiles 
SET role = 'admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'user@example.com');

-- Verify the changes
SELECT 
  u.email, 
  u.raw_user_meta_data->>'role' as auth_role,
  p.role as profile_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'user@example.com';
