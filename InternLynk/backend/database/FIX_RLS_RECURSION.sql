-- ============================================================
-- FIX RLS RECURSION SCRIPT
-- Run this in Supabase SQL Editor to eliminate infinite recursion in profiles & all tables
-- ============================================================

-- 1. Helper functions using SECURITY DEFINER to bypass RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_university()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'university'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_software_house()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'software_house'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_university() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_software_house() TO anon, authenticated, service_role;

-- 2. Fix Profiles RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow reading software house profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow reading university profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Allow reading software house profiles" 
ON public.profiles FOR SELECT 
USING (role = 'software_house');

CREATE POLICY "Allow reading university profiles" 
ON public.profiles FOR SELECT 
USING (role = 'university');

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Allow insert profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 3. Fix Internships RLS policies
DROP POLICY IF EXISTS "Anyone can view approved internships" ON public.internships;
DROP POLICY IF EXISTS "Software houses can view own internships" ON public.internships;
DROP POLICY IF EXISTS "Admins can view all internships" ON public.internships;
DROP POLICY IF EXISTS "Software houses can create internships" ON public.internships;
DROP POLICY IF EXISTS "Software houses can update own internships" ON public.internships;
DROP POLICY IF EXISTS "Admins can update all internships" ON public.internships;

CREATE POLICY "Anyone can view approved internships" 
ON public.internships FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Software houses can view own internships" 
ON public.internships FOR SELECT 
USING (auth.uid() = software_house_id);

CREATE POLICY "Admins can view all internships" 
ON public.internships FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Software houses can create internships" 
ON public.internships FOR INSERT 
WITH CHECK (auth.uid() = software_house_id AND public.is_software_house());

CREATE POLICY "Software houses can update own internships" 
ON public.internships FOR UPDATE 
USING (auth.uid() = software_house_id);

CREATE POLICY "Admins can update all internships" 
ON public.internships FOR UPDATE 
USING (public.is_admin());

-- 4. Fix Students RLS policies
DROP POLICY IF EXISTS "Students can view own record" ON public.students;
DROP POLICY IF EXISTS "Universities can view their students" ON public.students;
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
DROP POLICY IF EXISTS "Universities can insert students" ON public.students;

CREATE POLICY "Students can view own record" 
ON public.students FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Universities can view their students" 
ON public.students FOR SELECT 
USING (auth.uid() = university_id);

CREATE POLICY "Admins can view all students" 
ON public.students FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Universities can insert students" 
ON public.students FOR INSERT 
WITH CHECK (auth.uid() = university_id);

-- 5. Fix Applications RLS policies
DROP POLICY IF EXISTS "Users can view own applications" ON public.applications;
DROP POLICY IF EXISTS "Software houses can view applications for their internships" ON public.applications;
DROP POLICY IF EXISTS "Universities can view their student applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Users can create applications" ON public.applications;
DROP POLICY IF EXISTS "Software houses can update application status" ON public.applications;

CREATE POLICY "Users can view own applications" 
ON public.applications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Software houses can view applications for their internships" 
ON public.applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.internships 
    WHERE internships.id = applications.internship_id 
    AND internships.software_house_id = auth.uid()
  )
);

CREATE POLICY "Universities can view their student applications" 
ON public.applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = applications.user_id 
    AND profiles.university_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all applications" 
ON public.applications FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Users can create applications" 
ON public.applications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Software houses can update application status" 
ON public.applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.internships 
    WHERE internships.id = applications.internship_id 
    AND internships.software_house_id = auth.uid()
  )
);

-- 6. Fix Admin Logs RLS
DROP POLICY IF EXISTS "Admins can view logs" ON public.admin_logs;
CREATE POLICY "Admins can view logs" 
ON public.admin_logs FOR SELECT 
USING (public.is_admin());
