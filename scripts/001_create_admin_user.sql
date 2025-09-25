-- Create admin user script
-- Run this after setting up your first user account

-- Method 1: Update existing user to admin
-- Replace 'your-email@example.com' with the actual email of the user you want to make admin
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true, "role": "admin"}'::jsonb
WHERE email = 'your-email@example.com';

-- Also update the profiles table
UPDATE public.profiles 
SET is_admin = true, role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- Method 2: Create a new admin user (if you prefer)
-- You can also create a new user through Supabase Auth and then run the above UPDATE statements

-- Verify admin user was created
SELECT 
  u.email,
  p.full_name,
  p.is_admin,
  p.role
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE p.is_admin = true;


