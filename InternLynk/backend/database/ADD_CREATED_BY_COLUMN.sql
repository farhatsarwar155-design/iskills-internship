-- ============================================================
-- ADD CREATED_BY COLUMN TO INTERNSHIPS TABLE
-- Run this in Supabase SQL Editor to support internship creation & queries
-- ============================================================

-- Add created_by column
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Sync software_house_id and created_by
UPDATE public.internships SET created_by = software_house_id WHERE created_by IS NULL AND software_house_id IS NOT NULL;
UPDATE public.internships SET software_house_id = created_by WHERE software_house_id IS NULL AND created_by IS NOT NULL;

-- Make skills column default to empty array
ALTER TABLE public.internships ALTER COLUMN skills DROP NOT NULL;
ALTER TABLE public.internships ALTER COLUMN skills SET DEFAULT '{}';

-- Grant access
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
