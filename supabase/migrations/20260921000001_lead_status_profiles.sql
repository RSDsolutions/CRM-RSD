-- =============================================================
-- MIGRACIÓN 002: EVOLUCIÓN lead_status_enum + TABLA profiles
-- RSD Solutions CRM — Fase 1 Estructural — 21/09/2026
-- =============================================================
-- REGLA: Solo ADD VALUE (nunca eliminar valores del ENUM).
-- Los valores existentes se mantienen para compatibilidad con
-- leads actuales en producción.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EVOLUCIÓN DEL ENUM lead_status_enum
-- ─────────────────────────────────────────────────────────────
-- Flujo nuevo: Nuevo → Contactado → Diagnóstico → Demo → Feedback Demo
--              → Cita Agendada(compat.) → Propuesta → Negociación
--              → Aprobado → Convertido → Cerrado-Ganado(compat.) → Cerrado-Perdido → Perdido

ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'Diagnóstico'  AFTER 'Contactado';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'Demo'          AFTER 'Diagnóstico';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'Feedback Demo' AFTER 'Demo';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'Aprobado'      AFTER 'Negociación';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'Convertido'    AFTER 'Aprobado';
ALTER TYPE lead_status_enum ADD VALUE IF NOT EXISTS 'Perdido'       AFTER 'Cerrado-Perdido';

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA profiles (vinculada a auth.users)
-- ─────────────────────────────────────────────────────────────
-- Permite escalar assigned_to de TEXT → UUID → profiles.id
-- sin romper datos actuales.
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY,              -- igual que auth.users.id
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'comercial', -- admin | comercial
  email       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

DROP TRIGGER IF EXISTS trigger_set_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR public.get_user_role() = 'admin');

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.get_user_role() = 'admin')
  WITH CHECK (id = auth.uid() OR public.get_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 3. INSERTAR PERFILES PARA USUARIOS EXISTENTES
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, full_name, role, email)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'role', 'comercial'),
  u.email
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- Trigger para auto-crear perfil cuando se registra un usuario nuevo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'comercial'),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- FIN MIGRACIÓN 002
-- =============================================================
