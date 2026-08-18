-- ============================================================
-- FIX SIGNUP & LOGIN: DROP BROKEN AUTH TRIGGER
-- Run this in Supabase SQL Editor
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Ensure profiles table has proper permissions for signup
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
