-- ============================================================
-- FIX AUTH TRIGGER SCRIPT
-- Run this in Supabase SQL Editor
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (
      id,
      role,
      full_name,
      email,
      approval_status,
      is_active
    )
    VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role),
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.email,
      'approved'::public.approval_status,
      TRUE
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
