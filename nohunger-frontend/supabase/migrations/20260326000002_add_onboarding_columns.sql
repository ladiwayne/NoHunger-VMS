-- Add onboarding_completed and availability columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT ARRAY[]::TEXT[];
