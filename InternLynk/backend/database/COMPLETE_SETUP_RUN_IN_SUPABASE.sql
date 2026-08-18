-- ============================================================
-- InternLynk - COMPLETE DATABASE SETUP SCRIPT
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'university', 'software_house', 'guest', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE internship_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  university_id UUID NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NULL,
  organization_name TEXT NULL,
  email TEXT NULL,
  profile_picture TEXT NULL,
  approval_status approval_status NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all columns exist in profiles if table already existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_name TEXT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status approval_status NOT NULL DEFAULT 'pending';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_picture TEXT NULL;

-- 4. Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL,
  batch INTEGER,
  degree_program TEXT,
  semester INTEGER,
  credentials JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Create CV Forms Table
CREATE TABLE IF NOT EXISTS public.cv_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personal JSONB NOT NULL DEFAULT '{}'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Create Internships Table
CREATE TABLE IF NOT EXISTS public.internships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  software_house_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  duration TEXT NOT NULL,
  location TEXT,
  stipend NUMERIC,
  requirements TEXT,
  internship_type TEXT,
  status internship_status NOT NULL DEFAULT 'pending',
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ
);

ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS internship_type TEXT;
ALTER TABLE public.internships ADD COLUMN IF NOT EXISTS feedback TEXT;

-- 7. Create Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  internship_id UUID NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'pending',
  cv_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  feedback TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, internship_id)
);

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS feedback TEXT;

-- 8. Create Admin Logs Table
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  feedback TEXT,
  metadata JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Create Bulk Uploads Table
CREATE TABLE IF NOT EXISTS public.bulk_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing','completed','failed')),
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  error_log JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 10. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_id UUID,
  related_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- 11. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_university_id ON public.profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON public.profiles(approval_status);

CREATE INDEX IF NOT EXISTS idx_students_university_id ON public.students(university_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);

CREATE INDEX IF NOT EXISTS idx_internships_software_house_id ON public.internships(software_house_id);
CREATE INDEX IF NOT EXISTS idx_internships_status ON public.internships(status);
CREATE INDEX IF NOT EXISTS idx_internships_created_at ON public.internships(created_at);

CREATE INDEX IF NOT EXISTS idx_cv_forms_user_id ON public.cv_forms(user_id);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_internship_id ON public.applications(internship_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON public.admin_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 12. Timestamp Trigger Function
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_ts ON public.profiles;
CREATE TRIGGER update_profiles_ts BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

DROP TRIGGER IF EXISTS update_students_ts ON public.students;
CREATE TRIGGER update_students_ts BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

DROP TRIGGER IF EXISTS update_cv_forms_ts ON public.cv_forms;
CREATE TRIGGER update_cv_forms_ts BEFORE UPDATE ON public.cv_forms FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

DROP TRIGGER IF EXISTS update_internships_ts ON public.internships;
CREATE TRIGGER update_internships_ts BEFORE UPDATE ON public.internships FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

DROP TRIGGER IF EXISTS update_applications_ts ON public.applications;
CREATE TRIGGER update_applications_ts BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE PROCEDURE public.update_timestamp();

-- 13. Auth User to Profile Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role;
  initial_approval approval_status;
  user_name TEXT;
BEGIN
  -- Determine role
  assigned_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role);
  
  -- Determine approval status: admin, university, student are approved; software_house & guest need approval
  IF assigned_role IN ('admin', 'university', 'student') THEN
    initial_approval := 'approved'::approval_status;
  ELSE
    initial_approval := 'pending'::approval_status;
  END IF;

  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'organization_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    organization_name,
    email,
    approval_status,
    is_active
  )
  VALUES (
    NEW.id,
    assigned_role,
    user_name,
    NEW.raw_user_meta_data->>'organization_name',
    NEW.email,
    initial_approval,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill any existing auth users into profiles
INSERT INTO public.profiles (id, role, full_name, email, approval_status, is_active)
SELECT 
  u.id,
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'admin'::user_role),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  'approved'::approval_status,
  TRUE
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 14. Views
CREATE OR REPLACE VIEW public.application_tracking AS
SELECT a.id AS application_id,
       a.user_id,
       a.internship_id,
       a.status,
       a.feedback,
       a.applied_at,
       a.updated_at,
       i.title AS internship_title,
       i.software_house_id,
       p.role AS user_role,
       p.university_id
FROM public.applications a
JOIN public.internships i ON i.id = a.internship_id
JOIN public.profiles p ON p.id = a.user_id;

-- 15. Helper Functions
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.notifications
  WHERE user_id = user_uuid AND is_read = FALSE;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_pending_counts()
RETURNS JSONB AS $$
  SELECT jsonb_build_object(
    'internships', (SELECT COUNT(*) FROM public.internships WHERE status = 'pending'),
    'software_houses', (SELECT COUNT(*) FROM public.profiles WHERE role = 'software_house' AND approval_status = 'pending'),
    'guests', (SELECT COUNT(*) FROM public.profiles WHERE role = 'guest' AND approval_status = 'pending')
  );
$$ LANGUAGE sql STABLE;

-- 16. Helper functions for RLS (SECURITY DEFINER to avoid recursion)
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_university() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_software_house() TO anon, authenticated, service_role;

-- 17. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 18. Row Level Security Policies

-- Profiles Policies
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

-- Internships Policies
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

-- Students Policies
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

-- Applications Policies
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

-- CV Forms Policies
DROP POLICY IF EXISTS "Users can view own CV" ON public.cv_forms;
DROP POLICY IF EXISTS "Users can insert own CV" ON public.cv_forms;
DROP POLICY IF EXISTS "Users can update own CV" ON public.cv_forms;

CREATE POLICY "Users can view own CV" 
ON public.cv_forms FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CV" 
ON public.cv_forms FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CV" 
ON public.cv_forms FOR UPDATE 
USING (auth.uid() = user_id);

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Admin Logs Policies
DROP POLICY IF EXISTS "Admins can view logs" ON public.admin_logs;
CREATE POLICY "Admins can view logs" 
ON public.admin_logs FOR SELECT 
USING (public.is_admin());

-- Bulk Uploads Policies
DROP POLICY IF EXISTS "Universities can view own bulk uploads" ON public.bulk_uploads;
CREATE POLICY "Universities can view own bulk uploads" 
ON public.bulk_uploads FOR SELECT 
USING (auth.uid() = university_id);

-- 19. Grant table access
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
