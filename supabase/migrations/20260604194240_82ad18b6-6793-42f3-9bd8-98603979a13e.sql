
-- 1) Tabela de interesse em assinatura (waitlist)
CREATE TABLE IF NOT EXISTS public.subscription_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  combo text NOT NULL CHECK (combo IN ('degustacao','fds','esporte')),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'waitlist',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.subscription_interests TO authenticated;
GRANT INSERT ON public.subscription_interests TO anon;
GRANT ALL ON public.subscription_interests TO service_role;

ALTER TABLE public.subscription_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register interest"
  ON public.subscription_interests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can see own interests"
  ON public.subscription_interests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can see all interests"
  ON public.subscription_interests
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_subscription_interests_updated_at
  BEFORE UPDATE ON public.subscription_interests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2) Remover todos os admins atuais (limpa profiles + user_roles + auth.users)
DO $$
DECLARE
  old_admin_id uuid;
BEGIN
  FOR old_admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    DELETE FROM public.user_roles WHERE user_id = old_admin_id;
    DELETE FROM public.profiles WHERE id = old_admin_id;
    DELETE FROM auth.identities WHERE user_id = old_admin_id;
    DELETE FROM auth.users WHERE id = old_admin_id;
  END LOOP;
END $$;

-- 3) Criar o admin fixo adminova@amendobento.com / senha: adminova
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_admin_id uuid := gen_random_uuid();
BEGIN
  -- Remove qualquer usuário com esse email antes (caso já exista)
  DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'adminova@amendobento.com');
  DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email = 'adminova@amendobento.com');
  DELETE FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'adminova@amendobento.com');
  DELETE FROM auth.users WHERE email = 'adminova@amendobento.com';

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_admin_id,
    'authenticated',
    'authenticated',
    'adminova@amendobento.com',
    crypt('adminova', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Admin Amendobento"}'::jsonb,
    false, '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider, provider_id, identity_data, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    new_admin_id,
    'email',
    new_admin_id::text,
    jsonb_build_object('sub', new_admin_id::text, 'email', 'adminova@amendobento.com', 'email_verified', true),
    now(), now(), now()
  );

  INSERT INTO public.profiles (id, display_name)
  VALUES (new_admin_id, 'Admin Amendobento')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_admin_id, 'admin')
  ON CONFLICT DO NOTHING;
END $$;
