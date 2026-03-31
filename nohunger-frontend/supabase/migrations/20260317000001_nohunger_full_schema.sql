-- ============================================================
-- NoHunger Initiative - Full Platform Schema
-- ============================================================

-- ============================================================
-- 1. ENUMS / TYPES
-- ============================================================

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('volunteer', 'admin');

DROP TYPE IF EXISTS public.volunteer_status CASCADE;
CREATE TYPE public.volunteer_status AS ENUM ('pending', 'approved', 'rejected', 'suspended');

DROP TYPE IF EXISTS public.activity_status CASCADE;
CREATE TYPE public.activity_status AS ENUM ('draft', 'published', 'ongoing', 'completed', 'cancelled');

DROP TYPE IF EXISTS public.invitation_status CASCADE;
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');

DROP TYPE IF EXISTS public.checkin_status CASCADE;
CREATE TYPE public.checkin_status AS ENUM ('pending', 'approved', 'rejected', 'checked_out');

DROP TYPE IF EXISTS public.task_status CASCADE;
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');

DROP TYPE IF EXISTS public.task_priority CASCADE;
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

DROP TYPE IF EXISTS public.notification_type CASCADE;
CREATE TYPE public.notification_type AS ENUM ('invitation', 'checkin_approved', 'checkin_rejected', 'broadcast', 'task_assigned', 'event_reminder', 'application_approved', 'application_rejected', 'checkout_done');

DROP TYPE IF EXISTS public.broadcast_target CASCADE;
CREATE TYPE public.broadcast_target AS ENUM ('all', 'activity', 'group');

DROP TYPE IF EXISTS public.application_status CASCADE;
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================
-- 2. CORE TABLES
-- ============================================================

-- User profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  region TEXT,
  role public.user_role DEFAULT 'volunteer'::public.user_role,
  volunteer_status public.volunteer_status DEFAULT 'pending'::public.volunteer_status,
  skills TEXT[] DEFAULT ARRAY[]::TEXT[],
  avatar_url TEXT,
  bio TEXT,
  total_hours NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer groups (for broadcast targeting)
CREATE TABLE IF NOT EXISTS public.volunteer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Group memberships
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.volunteer_groups(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, volunteer_id)
);

-- Activities / Events
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  activity_type TEXT DEFAULT 'event',
  location TEXT,
  venue_lat NUMERIC(10,7),
  venue_lng NUMERIC(10,7),
  venue_radius_meters INTEGER DEFAULT 500,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  max_volunteers INTEGER,
  status public.activity_status DEFAULT 'draft'::public.activity_status,
  checkin_code TEXT UNIQUE,
  checkin_link TEXT UNIQUE,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Volunteer applications to activities
CREATE TABLE IF NOT EXISTS public.activity_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  status public.application_status DEFAULT 'pending'::public.application_status,
  message TEXT,
  reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, volunteer_id)
);

-- Event invitations sent by admin to volunteers
CREATE TABLE IF NOT EXISTS public.event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status public.invitation_status DEFAULT 'pending'::public.invitation_status,
  message TEXT,
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, volunteer_id)
);

-- Check-in / Check-out records
CREATE TABLE IF NOT EXISTS public.checkin_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  checkin_time TIMESTAMPTZ,
  checkout_time TIMESTAMPTZ,
  hours_spent NUMERIC(6,2),
  status public.checkin_status DEFAULT 'pending'::public.checkin_status,
  checkin_code_used TEXT,
  approved_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  checkout_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  status public.task_status DEFAULT 'todo'::public.task_status,
  priority public.task_priority DEFAULT 'medium'::public.task_priority,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Broadcasts
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type public.broadcast_target DEFAULT 'all'::public.broadcast_target,
  target_activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  target_group_id UUID REFERENCES public.volunteer_groups(id) ON DELETE SET NULL,
  sent_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  recipient_count INTEGER DEFAULT 0
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  notification_type public.notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_volunteer_status ON public.user_profiles(volunteer_status);
CREATE INDEX IF NOT EXISTS idx_activities_status ON public.activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON public.activities(start_date);
CREATE INDEX IF NOT EXISTS idx_activity_applications_volunteer ON public.activity_applications(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_activity_applications_activity ON public.activity_applications(activity_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_volunteer ON public.event_invitations(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_activity ON public.event_invitations(activity_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_volunteer ON public.checkin_records(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_activity ON public.checkin_records(activity_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_status ON public.checkin_records(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_activity ON public.tasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_group_members_volunteer ON public.group_members(volunteer_id);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- Handle new user registration (trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, volunteer_status, skills, phone, region)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'volunteer')::public.user_role,
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'volunteer') = 'admin' THEN 'approved'::public.volunteer_status
      ELSE 'pending'::public.volunteer_status
    END,
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'skills')),
      ARRAY[]::TEXT[]
    ),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'region', NULL)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Generate unique check-in code for activity
CREATE OR REPLACE FUNCTION public.generate_checkin_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  base_url TEXT := 'https://nohunger5912.builtwithrocket.new';
BEGIN
  IF NEW.checkin_code IS NULL THEN
    new_code := upper(substring(md5(NEW.id::TEXT || now()::TEXT) FROM 1 FOR 8));
    NEW.checkin_code := new_code;
    NEW.checkin_link := base_url || '/checkin/' || new_code;
  END IF;
  RETURN NEW;
END;
$$;

-- Calculate hours when checkout happens
CREATE OR REPLACE FUNCTION public.calculate_hours_on_checkout()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.checkout_time IS NOT NULL AND OLD.checkout_time IS NULL AND NEW.checkin_time IS NOT NULL THEN
    NEW.hours_spent := ROUND(EXTRACT(EPOCH FROM (NEW.checkout_time - NEW.checkin_time)) / 3600.0, 2);
    NEW.status := 'checked_out'::public.checkin_status;
  END IF;
  RETURN NEW;
END;
$$;

-- Update volunteer total hours after checkout
CREATE OR REPLACE FUNCTION public.update_volunteer_total_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'checked_out' AND OLD.status != 'checked_out' AND NEW.hours_spent IS NOT NULL THEN
    UPDATE public.user_profiles
    SET total_hours = total_hours + NEW.hours_spent,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.volunteer_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Role check function (safe for RLS - queries auth.users not user_profiles)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  );
$$;

-- Get volunteer role from user_profiles (for non-user_profiles tables)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role::TEXT FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- 5. ENABLE RLS
-- ============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================

-- user_profiles: own row + admin sees all
DROP POLICY IF EXISTS "users_manage_own_profile" ON public.user_profiles;
CREATE POLICY "users_manage_own_profile" ON public.user_profiles
FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "admin_manage_all_profiles" ON public.user_profiles;
CREATE POLICY "admin_manage_all_profiles" ON public.user_profiles
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- volunteer_groups: admin manages, volunteers read
DROP POLICY IF EXISTS "admin_manage_groups" ON public.volunteer_groups;
CREATE POLICY "admin_manage_groups" ON public.volunteer_groups
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "volunteers_read_groups" ON public.volunteer_groups;
CREATE POLICY "volunteers_read_groups" ON public.volunteer_groups
FOR SELECT TO authenticated
USING (true);

-- group_members
DROP POLICY IF EXISTS "admin_manage_group_members" ON public.group_members;
CREATE POLICY "admin_manage_group_members" ON public.group_members
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "volunteers_read_own_memberships" ON public.group_members;
CREATE POLICY "volunteers_read_own_memberships" ON public.group_members
FOR SELECT TO authenticated
USING (volunteer_id = auth.uid());

-- activities: admin manages, volunteers read published
DROP POLICY IF EXISTS "admin_manage_activities" ON public.activities;
CREATE POLICY "admin_manage_activities" ON public.activities
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "volunteers_read_activities" ON public.activities;
CREATE POLICY "volunteers_read_activities" ON public.activities
FOR SELECT TO authenticated
USING (status IN ('published', 'ongoing', 'completed'));

-- activity_applications
DROP POLICY IF EXISTS "admin_manage_applications" ON public.activity_applications;
CREATE POLICY "admin_manage_applications" ON public.activity_applications
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "volunteers_manage_own_applications" ON public.activity_applications;
CREATE POLICY "volunteers_manage_own_applications" ON public.activity_applications
FOR ALL TO authenticated
USING (volunteer_id = auth.uid())
WITH CHECK (volunteer_id = auth.uid());

-- event_invitations
DROP POLICY IF EXISTS "admin_manage_invitations" ON public.event_invitations;
CREATE POLICY "admin_manage_invitations" ON public.event_invitations
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "volunteers_manage_own_invitations" ON public.event_invitations;
CREATE POLICY "volunteers_manage_own_invitations" ON public.event_invitations
FOR ALL TO authenticated
USING (volunteer_id = auth.uid())
WITH CHECK (volunteer_id = auth.uid());

-- checkin_records
DROP POLICY IF EXISTS "admin_manage_checkins" ON public.checkin_records;
CREATE POLICY "admin_manage_checkins" ON public.checkin_records
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "volunteers_manage_own_checkins" ON public.checkin_records;
CREATE POLICY "volunteers_manage_own_checkins" ON public.checkin_records
FOR ALL TO authenticated
USING (volunteer_id = auth.uid())
WITH CHECK (volunteer_id = auth.uid());

-- tasks
DROP POLICY IF EXISTS "admin_manage_tasks" ON public.tasks;
CREATE POLICY "admin_manage_tasks" ON public.tasks
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "volunteers_read_assigned_tasks" ON public.tasks;
CREATE POLICY "volunteers_read_assigned_tasks" ON public.tasks
FOR SELECT TO authenticated
USING (assigned_to = auth.uid());

DROP POLICY IF EXISTS "volunteers_update_assigned_tasks" ON public.tasks;
CREATE POLICY "volunteers_update_assigned_tasks" ON public.tasks
FOR UPDATE TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

-- broadcasts
DROP POLICY IF EXISTS "admin_manage_broadcasts" ON public.broadcasts;
CREATE POLICY "admin_manage_broadcasts" ON public.broadcasts
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "volunteers_read_broadcasts" ON public.broadcasts;
CREATE POLICY "volunteers_read_broadcasts" ON public.broadcasts
FOR SELECT TO authenticated
USING (true);

-- notifications
DROP POLICY IF EXISTS "users_manage_own_notifications" ON public.notifications;
CREATE POLICY "users_manage_own_notifications" ON public.notifications
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_insert_notifications" ON public.notifications;
CREATE POLICY "admin_insert_notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (public.is_admin() OR user_id = auth.uid());

-- ============================================================
-- 7. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
CREATE TRIGGER update_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS generate_activity_checkin_code ON public.activities;
CREATE TRIGGER generate_activity_checkin_code
  BEFORE INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.generate_checkin_code();

DROP TRIGGER IF EXISTS calculate_hours_on_checkout ON public.checkin_records;
CREATE TRIGGER calculate_hours_on_checkout
  BEFORE UPDATE ON public.checkin_records
  FOR EACH ROW EXECUTE FUNCTION public.calculate_hours_on_checkout();

DROP TRIGGER IF EXISTS update_volunteer_hours_after_checkout ON public.checkin_records;
CREATE TRIGGER update_volunteer_hours_after_checkout
  AFTER UPDATE ON public.checkin_records
  FOR EACH ROW EXECUTE FUNCTION public.update_volunteer_total_hours();

DROP TRIGGER IF EXISTS update_checkin_updated_at ON public.checkin_records;
CREATE TRIGGER update_checkin_updated_at
  BEFORE UPDATE ON public.checkin_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 8. MOCK DATA
-- ============================================================

DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
  vol1_uuid UUID := gen_random_uuid();
  vol2_uuid UUID := gen_random_uuid();
  vol3_uuid UUID := gen_random_uuid();
  vol4_uuid UUID := gen_random_uuid();
  act1_uuid UUID := gen_random_uuid();
  act2_uuid UUID := gen_random_uuid();
  act3_uuid UUID := gen_random_uuid();
  group1_uuid UUID := gen_random_uuid();
  inv1_uuid UUID := gen_random_uuid();
  inv2_uuid UUID := gen_random_uuid();
  checkin1_uuid UUID := gen_random_uuid();
  checkin2_uuid UUID := gen_random_uuid();
BEGIN
  -- Admin user
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@nohunger.org', crypt('Admin@2026', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Emeka Okafor', 'role', 'admin', 'phone', '+2348012000001', 'region', 'Lagos State'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin'),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (id) DO NOTHING;

  -- Volunteer 1 (Chidi Obi - existing demo user)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    vol1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'chidi.obi@nohunger.org', crypt('Volunteer@2026', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Chidi Obi', 'role', 'volunteer', 'phone', '+2348012000002', 'region', 'Lagos State', 'skills', '["food-packing","distribution","logistics"]'::jsonb),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (id) DO NOTHING;

  -- Volunteer 2
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    vol2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'kofi.owusu@nohunger.org', crypt('Volunteer@2026', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Kofi Owusu', 'role', 'volunteer', 'phone', '+233244000003', 'region', 'Ashanti Region', 'skills', '["cooking","community-outreach"]'::jsonb),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (id) DO NOTHING;

  -- Volunteer 3
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    vol3_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'ama.boateng@nohunger.org', crypt('Volunteer@2026', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Adaeze Okonkwo', 'role', 'volunteer', 'phone', '+2348012000003', 'region', 'Abuja (FCT)', 'skills', '["cooking","community-outreach"]'::jsonb),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (id) DO NOTHING;

  -- Volunteer 4 (pending approval)
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    vol4_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'tunde.balogun@nohunger.org', crypt('Volunteer@2026', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Tunde Balogun', 'role', 'volunteer', 'phone', '+2348012000005', 'region', 'Oyo State', 'skills', '["logistics"]'::jsonb),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (id) DO NOTHING;

  -- Update volunteer statuses and hours after trigger creates profiles
  UPDATE public.user_profiles SET
    volunteer_status = 'approved'::public.volunteer_status,
    total_hours = 184.5
  WHERE email = 'chidi.obi@nohunger.org';

  UPDATE public.user_profiles SET
    volunteer_status = 'approved'::public.volunteer_status,
    total_hours = 96.0
  WHERE email = 'ama.boateng@nohunger.org';

  UPDATE public.user_profiles SET
    volunteer_status = 'approved'::public.volunteer_status,
    total_hours = 52.5
  WHERE email = 'tunde.balogun@nohunger.org';

  UPDATE public.user_profiles SET
    volunteer_status = 'pending'::public.volunteer_status,
    total_hours = 0
  WHERE email = 'kofi.owusu@nohunger.org';

  -- Activities
  INSERT INTO public.activities (
    id, title, description, activity_type, location, start_date, end_date,
    max_volunteers, status, checkin_code, checkin_link, created_by
  )
  SELECT
    act1_uuid,
    'Lagos Food Drive - March 2026',
    'Monthly food distribution drive at Mushin Community Centre. Volunteers will pack and distribute food parcels to 500 families.',
    'outreach',
    'Mushin Community Centre, Lagos',
    now() + interval '3 days',
    now() + interval '3 days' + interval '6 hours',
    50,
    'published'::public.activity_status,
    'LAGOS001',
    'https://nohunger5912.builtwithrocket.new/checkin/LAGOS001',
    id
  FROM public.user_profiles WHERE email = 'admin@nohunger.org' LIMIT 1
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.activities (
    id, title, description, activity_type, location, start_date, end_date,
    max_volunteers, status, checkin_code, checkin_link, created_by
  )
  SELECT
    act2_uuid,
    'Abuja School Feeding Program',
    'Cooking and serving nutritious meals to 300 school children at Garki Primary School.',
    'school_feeding',
    'Garki Primary School, Abuja',
    now() + interval '7 days',
    now() + interval '7 days' + interval '5 hours',
    30,
    'published'::public.activity_status,
    'ABUJA002',
    'https://nohunger5912.builtwithrocket.new/checkin/ABUJA002',
    id
  FROM public.user_profiles WHERE email = 'admin@nohunger.org' LIMIT 1
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.activities (
    id, title, description, activity_type, location, start_date, end_date,
    max_volunteers, status, checkin_code, checkin_link, created_by
  )
  SELECT
    act3_uuid,
    'Port Harcourt Community Outreach',
    'Community health and nutrition awareness campaign at Diobu fishing community.',
    'outreach',
    'Diobu Market, Port Harcourt',
    now() - interval '14 days',
    now() - interval '14 days' + interval '4 hours',
    25,
    'completed'::public.activity_status,
    'PORTHC03',
    'https://nohunger5912.builtwithrocket.new/checkin/PORTHC03',
    id
  FROM public.user_profiles WHERE email = 'admin@nohunger.org' LIMIT 1
  ON CONFLICT (id) DO NOTHING;

  -- Volunteer group
  INSERT INTO public.volunteer_groups (id, name, description, created_by)
  SELECT group1_uuid, 'Lagos State Volunteers', 'Volunteers based in Lagos State', id
  FROM public.user_profiles WHERE email = 'admin@nohunger.org' LIMIT 1
  ON CONFLICT (id) DO NOTHING;

  -- Group members
  INSERT INTO public.group_members (group_id, volunteer_id)
  SELECT group1_uuid, id FROM public.user_profiles WHERE email = 'chidi.obi@nohunger.org' LIMIT 1
  ON CONFLICT (group_id, volunteer_id) DO NOTHING;

  INSERT INTO public.group_members (group_id, volunteer_id)
  SELECT group1_uuid, id FROM public.user_profiles WHERE email = 'ama.boateng@nohunger.org' LIMIT 1
  ON CONFLICT (group_id, volunteer_id) DO NOTHING;

  -- Invitations
  INSERT INTO public.event_invitations (id, activity_id, volunteer_id, sent_by, status, message, expires_at)
  SELECT
    inv1_uuid, act1_uuid, up.id, admin.id,
    'pending'::public.invitation_status,
    'We would love to have you join our Lagos Food Drive! Your logistics skills will be invaluable.',
    now() + interval '2 days'
  FROM public.user_profiles up, public.user_profiles admin
  WHERE up.email = 'chidi.obi@nohunger.org' AND admin.email = 'admin@nohunger.org'
  ON CONFLICT (activity_id, volunteer_id) DO NOTHING;

  INSERT INTO public.event_invitations (id, activity_id, volunteer_id, sent_by, status, message, expires_at)
  SELECT
    inv2_uuid, act2_uuid, up.id, admin.id,
    'pending'::public.invitation_status,
    'Your cooking skills are needed for the Abuja School Feeding Program!',
    now() + interval '6 days'
  FROM public.user_profiles up, public.user_profiles admin
  WHERE up.email = 'chidi.obi@nohunger.org' AND admin.email = 'admin@nohunger.org'
  ON CONFLICT (activity_id, volunteer_id) DO NOTHING;

  -- Applications
  INSERT INTO public.activity_applications (activity_id, volunteer_id, status, message)
  SELECT act1_uuid, up.id, 'approved'::public.application_status, 'I am experienced in food packing and would love to help.'
  FROM public.user_profiles up WHERE up.email = 'ama.boateng@nohunger.org' LIMIT 1
  ON CONFLICT (activity_id, volunteer_id) DO NOTHING;

  INSERT INTO public.activity_applications (activity_id, volunteer_id, status, message)
  SELECT act2_uuid, up.id, 'pending'::public.application_status, 'I have cooking experience and want to contribute.'
  FROM public.user_profiles up WHERE up.email = 'tunde.balogun@nohunger.org' LIMIT 1
  ON CONFLICT (activity_id, volunteer_id) DO NOTHING;

  -- Past check-in records (completed)
  INSERT INTO public.checkin_records (
    id, activity_id, volunteer_id, checkin_time, checkout_time, hours_spent,
    status, checkin_code_used, approved_by, approved_at
  )
  SELECT
    checkin1_uuid, act3_uuid, vol.id,
    now() - interval '14 days' + interval '8 hours',
    now() - interval '14 days' + interval '12 hours',
    4.0,
    'checked_out'::public.checkin_status,
    'TEMA003',
    admin.id,
    now() - interval '14 days' + interval '8 hours' + interval '5 minutes'
  FROM public.user_profiles vol, public.user_profiles admin
  WHERE vol.email = 'amara.mensah@nohunger.org' AND admin.email = 'admin@nohunger.org'
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.checkin_records (
    id, activity_id, volunteer_id, checkin_time, checkout_time, hours_spent,
    status, checkin_code_used, approved_by, approved_at
  )
  SELECT
    checkin2_uuid, act3_uuid, vol.id,
    now() - interval '14 days' + interval '8 hours',
    now() - interval '14 days' + interval '12 hours' + interval '30 minutes',
    4.5,
    'checked_out'::public.checkin_status,
    'TEMA003',
    admin.id,
    now() - interval '14 days' + interval '8 hours' + interval '5 minutes'
  FROM public.user_profiles vol, public.user_profiles admin
  WHERE vol.email = 'kofi.owusu@nohunger.org' AND admin.email = 'admin@nohunger.org'
  ON CONFLICT (id) DO NOTHING;

  -- Tasks
  INSERT INTO public.tasks (activity_id, title, description, assigned_to, assigned_by, status, priority, due_date)
  SELECT
    act1_uuid,
    'Prepare food packing stations',
    'Set up 10 packing stations with boxes, labels, and food items before 8am.',
    vol.id, admin.id,
    'todo'::public.task_status,
    'high'::public.task_priority,
    now() + interval '3 days'
  FROM public.user_profiles vol, public.user_profiles admin
  WHERE vol.email = 'amara.mensah@nohunger.org' AND admin.email = 'admin@nohunger.org'
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.tasks (activity_id, title, description, assigned_to, assigned_by, status, priority, due_date)
  SELECT
    act1_uuid,
    'Coordinate volunteer registration',
    'Check in arriving volunteers and assign them to stations.',
    vol.id, admin.id,
    'todo'::public.task_status,
    'medium'::public.task_priority,
    now() + interval '3 days'
  FROM public.user_profiles vol, public.user_profiles admin
  WHERE vol.email = 'amara.mensah@nohunger.org' AND admin.email = 'admin@nohunger.org'
  ON CONFLICT (id) DO NOTHING;

  -- Notifications
  INSERT INTO public.notifications (user_id, notification_type, title, message, related_id)
  SELECT
    vol.id,
    'invitation'::public.notification_type,
    'New Event Invitation',
    'You have been invited to Lagos Food Drive - March 2026',
    act1_uuid
  FROM public.user_profiles vol WHERE vol.email = 'chidi.obi@nohunger.org' LIMIT 1
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.notifications (user_id, notification_type, title, message, related_id)
  SELECT
    vol.id,
    'task_assigned'::public.notification_type,
    'New Task Assigned',
    'You have been assigned: Prepare food packing stations',
    act1_uuid
  FROM public.user_profiles vol WHERE vol.email = 'amara.mensah@nohunger.org' LIMIT 1
  ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Mock data error: %', SQLERRM;
END $$;
