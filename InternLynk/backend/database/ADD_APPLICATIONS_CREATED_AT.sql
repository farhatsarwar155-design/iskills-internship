-- ============================================================
-- ADD CREATED_AT TO APPLICATIONS TABLE
-- ============================================================
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
UPDATE public.applications SET created_at = applied_at WHERE created_at IS NULL AND applied_at IS NOT NULL;

SELECT pg_notify('pgrst', 'reload schema');
