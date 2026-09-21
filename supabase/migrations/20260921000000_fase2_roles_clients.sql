-- =============================================================
-- MIGRACIÓN FASE 2: IDENTIDAD, ROLES Y CLIENTES
-- RSD Solutions CRM — 21/09/2026
-- =============================================================
-- REGLA: Esta migración es 100% aditiva. No elimina ni modifica
-- columnas existentes. Es segura ejecutar con la app en producción.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. FUNCIÓN HELPER DE ROL (lee metadata de Supabase Auth)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'comercial'  -- rol por defecto si no tiene metadata
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 1. EXTENDER TABLA leads (solo ADD COLUMN IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS phone               TEXT,
  ADD COLUMN IF NOT EXISTS email               TEXT,
  ADD COLUMN IF NOT EXISTS lead_source         TEXT,        -- Facebook Ads, Google Ads, Referido, Otro
  ADD COLUMN IF NOT EXISTS priority            TEXT NOT NULL DEFAULT 'Media',  -- Alta, Media, Baja
  ADD COLUMN IF NOT EXISTS converted_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_id           UUID,        -- se llena al convertir
  ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID;       -- FK lógica a auth.users (no FK real para evitar restricciones en auth schema)

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA: clients
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     TEXT NOT NULL,
  trade_name       TEXT,
  tax_id           TEXT,
  industry         TEXT,
  website          TEXT,
  phone            TEXT,
  whatsapp         TEXT,
  email            TEXT,
  address          TEXT,
  city             TEXT,
  country          TEXT NOT NULL DEFAULT 'Ecuador',
  status           TEXT NOT NULL DEFAULT 'Activo',   -- Activo, Inactivo, Suspendido
  lead_id          UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  assigned_to      UUID,    -- FK lógica a auth.users
  converted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_lead_id    ON public.clients(lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_status     ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned   ON public.clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- Trigger updated_at para clients
DROP TRIGGER IF EXISTS trigger_set_clients_updated_at ON public.clients;
CREATE TRIGGER trigger_set_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select_authenticated" ON public.clients;
CREATE POLICY "clients_select_authenticated"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "clients_insert_authenticated" ON public.clients;
CREATE POLICY "clients_insert_authenticated"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "clients_update_authenticated" ON public.clients;
CREATE POLICY "clients_update_authenticated"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "clients_delete_admin_only" ON public.clients;
CREATE POLICY "clients_delete_admin_only"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 3. TABLA: client_contacts
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  job_title   TEXT,
  email       TEXT,
  phone       TEXT,
  whatsapp    TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT false,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON public.client_contacts(client_id);

DROP TRIGGER IF EXISTS trigger_set_client_contacts_updated_at ON public.client_contacts;
CREATE TRIGGER trigger_set_client_contacts_updated_at
  BEFORE UPDATE ON public.client_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_contacts_all_authenticated" ON public.client_contacts;
CREATE POLICY "client_contacts_all_authenticated"
  ON public.client_contacts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 4. TABLA: audit_logs
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name     TEXT NOT NULL,
  record_id      UUID NOT NULL,
  action         TEXT NOT NULL,        -- INSERT, UPDATE, DELETE
  old_values     JSONB,
  new_values     JSONB,
  changed_fields TEXT[],
  user_id        UUID,                 -- auth.uid() al momento del cambio
  user_email     TEXT,                 -- desnormalizado para trazabilidad
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id      ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at   ON public.audit_logs(created_at DESC);

-- RLS audit_logs: solo el admin puede leer; el sistema inserta via función SECURITY DEFINER
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 5. FUNCIÓN Y TRIGGER DE AUDITORÍA
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_values JSONB := NULL;
  v_new_values JSONB := NULL;
  v_changed    TEXT[] := NULL;
  v_record_id  UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_new_values := to_jsonb(NEW);
    v_record_id  := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_values := to_jsonb(OLD);
    v_new_values := to_jsonb(NEW);
    v_record_id  := NEW.id;
    -- Calcular qué campos cambiaron
    SELECT array_agg(key)
    INTO v_changed
    FROM jsonb_each(v_old_values) AS o(key, val)
    WHERE val IS DISTINCT FROM (v_new_values -> key);
  ELSIF TG_OP = 'DELETE' THEN
    v_old_values := to_jsonb(OLD);
    v_record_id  := OLD.id;
  END IF;

  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_fields,
    user_id,
    user_email
  ) VALUES (
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    v_old_values,
    v_new_values,
    v_changed,
    auth.uid(),
    (auth.jwt() ->> 'email')
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger de auditoría en leads
DROP TRIGGER IF EXISTS trigger_audit_leads ON public.leads;
CREATE TRIGGER trigger_audit_leads
  AFTER INSERT OR UPDATE OR DELETE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- Trigger de auditoría en clients
DROP TRIGGER IF EXISTS trigger_audit_clients ON public.clients;
CREATE TRIGGER trigger_audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_audit_log();

-- ─────────────────────────────────────────────────────────────
-- 6. ACTUALIZAR FOREIGN KEY de leads.client_id → clients
-- ─────────────────────────────────────────────────────────────
-- No se puede hacer FK directa aquí porque clients se crea en esta misma migración.
-- La integridad se maneja a nivel de aplicación por ahora.
-- Se añadirá formalmente en una migración posterior.

-- =============================================================
-- FIN MIGRACIÓN FASE 2
-- =============================================================
