-- Add account freeze fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_frozen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS frozen_reason text,
  ADD COLUMN IF NOT EXISTS frozen_at timestamp with time zone;

-- Optional: Allow authenticated users to read their own freeze state via existing profiles_select_own policy
-- Admin updates will be handled via server-side with service role or an admin-specific policy if needed


