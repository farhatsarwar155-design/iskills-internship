-- ============================================================
-- FIX FOREIGN KEYS - COMPATIBLE SYNTAX
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add created_by column to internships (safe)
ALTER TABLE public.internships
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- 2. Add foreign keys using DO $$ block (avoids IF NOT EXISTS error)
DO $$
BEGIN

  -- internships.created_by -> profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'internships_created_by_fkey'
  ) THEN
    ALTER TABLE public.internships
      ADD CONSTRAINT internships_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;

  -- applications.user_id -> profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_user_id_fkey'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- applications.internship_id -> internships.id
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_internship_id_fkey'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_internship_id_fkey
      FOREIGN KEY (internship_id) REFERENCES public.internships(id) ON DELETE CASCADE;
  END IF;

END $$;

-- 3. Sync created_by <-> software_house_id
UPDATE public.internships
  SET created_by = software_house_id
  WHERE created_by IS NULL AND software_house_id IS NOT NULL;

UPDATE public.internships
  SET software_house_id = created_by
  WHERE software_house_id IS NULL AND created_by IS NOT NULL;

-- 4. Fix skills column
ALTER TABLE public.internships ALTER COLUMN skills DROP NOT NULL;
ALTER TABLE public.internships ALTER COLUMN skills SET DEFAULT '{}';

-- 5. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 6. Reload Supabase schema cache
SELECT pg_notify('pgrst', 'reload schema');
