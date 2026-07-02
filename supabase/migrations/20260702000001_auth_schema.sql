-- Migration: auth schema — roles & profiles
-- Tables: roles, profiles
-- RLS: ya

-- 1. Roles master
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed 3 role
INSERT INTO public.roles (id, name) VALUES
  (1, 'super_admin'),
  (2, 'admin_kepegawaian'),
  (3, 'pegawai');

-- Reset sequence setelah manual insert
SELECT setval('roles_id_seq', 3, true);

-- 2. Profiles (1:1 ke auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES public.roles(id),
  nama_lengkap TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Auto-create profile saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role_id)
  VALUES (NEW.id, 3);  -- default role: pegawai
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS: roles — semua authenticated bisa read
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "semua_dapat_membaca_roles" ON public.roles
  FOR SELECT TO authenticated
  USING (true);

-- 5. RLS: profiles — admin bisa lihat semua, user lihat sendiri
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_dapat_mengelola_semua_profile" ON public.profiles
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role_id IN (1, 2)
  ));

CREATE POLICY "user_dapat_melihat_profile_sendiri" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());
