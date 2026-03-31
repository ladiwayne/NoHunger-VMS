-- ============================================================
-- Fix admin user: ensure admin@nohunger.org exists with correct password
-- ============================================================

DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if admin already exists in auth.users
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@nohunger.org' LIMIT 1;

  IF admin_id IS NULL THEN
    -- Admin does not exist, insert fresh
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin@nohunger.org', crypt('Admin@2026', gen_salt('bf', 10)), now(), now(), now(),
      jsonb_build_object('full_name', 'Emeka Okafor', 'role', 'admin', 'phone', '+2348012000001', 'region', 'Lagos State'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin'),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    );
  ELSE
    -- Admin exists, update password and confirm email
    UPDATE auth.users
    SET
      encrypted_password = crypt('Admin@2026', gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      raw_user_meta_data = jsonb_build_object('full_name', 'Emeka Okafor', 'role', 'admin', 'phone', '+2348012000001', 'region', 'Lagos State'),
      raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin')
    WHERE id = admin_id;
  END IF;

  -- Ensure admin identity exists (required for email/password login)
  INSERT INTO auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
  ) VALUES (
    admin_id,
    admin_id,
    'admin@nohunger.org',
    'email',
    jsonb_build_object('sub', admin_id::TEXT, 'email', 'admin@nohunger.org', 'email_verified', true),
    now(),
    now(),
    now()
  ) ON CONFLICT (provider, provider_id) DO UPDATE
    SET identity_data = jsonb_build_object('sub', admin_id::TEXT, 'email', 'admin@nohunger.org', 'email_verified', true),
        updated_at = now();

  -- Ensure admin profile exists in public.user_profiles
  INSERT INTO public.user_profiles (id, email, full_name, role, phone, region, is_active, created_at, updated_at)
  VALUES (
    admin_id,
    'admin@nohunger.org',
    'Emeka Okafor',
    'admin'::public.user_role,
    '+2348012000001',
    'Lagos State',
    true,
    now(),
    now()
  ) ON CONFLICT (id) DO UPDATE
    SET
      role = 'admin'::public.user_role,
      full_name = 'Emeka Okafor',
      email = 'admin@nohunger.org',
      is_active = true,
      updated_at = now();

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Admin user setup failed: %', SQLERRM;
END $$;
