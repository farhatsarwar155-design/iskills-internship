-- ============================================================
-- FIX APPLICATIONS TABLE (ADD COVER_LETTER, CREATED_AT, ETC)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add all expected columns to applications table
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS cover_letter TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS resume_url TEXT,
  ADD COLUMN IF NOT EXISTS cv_data JSONB;

-- 2. Populate created_at from applied_at if applied_at exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'applied_at'
  ) THEN
    UPDATE public.applications 
    SET created_at = applied_at 
    WHERE created_at IS NULL AND applied_at IS NOT NULL;
  END IF;
END $$;

-- 3. Ensure permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Reload PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');
