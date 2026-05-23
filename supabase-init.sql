CREATE TABLE IF NOT EXISTS public.settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.settings (key, value)
VALUES (
  'installment_dates',
  '{"first":null,"second":null,"third":null}'
)
ON CONFLICT (key) DO NOTHING;

-- Optional hardening later:
-- Admin credentials stored with a password hash.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.admin_users (
  email text PRIMARY KEY,
  password_hash text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.verify_admin_login(p_email text, p_password text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE lower(email) = lower(p_email)
      AND password_hash = extensions.crypt(p_password, password_hash)
  );
$$;

GRANT EXECUTE ON FUNCTION public.verify_admin_login(text, text) TO anon, authenticated;

-- Example seed (replace with your own email/password):
-- INSERT INTO public.admin_users (email, password_hash)
-- VALUES ('admin@example.com', extensions.crypt('change-this-password', extensions.gen_salt('bf')))
-- ON CONFLICT (email) DO UPDATE
-- SET password_hash = EXCLUDED.password_hash,
--     updated_at = now();
