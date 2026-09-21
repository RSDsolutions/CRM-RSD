-- =============================================================
-- MIGRACIÓN 003: DEMOS + DEMO_FEEDBACK + PROPOSALS + PROJECTS
-- RSD Solutions CRM — Fase 1 Estructural — 21/09/2026
-- =============================================================
-- Trazabilidad completa: Lead → Demo → Propuesta → Cliente → Proyecto
-- Todas las FK son nullable donde la relación es opcional.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. TABLA: demos
-- ─────────────────────────────────────────────────────────────
-- Una demo siempre parte de un lead. Puede relacionarse con un
-- cliente si el prospecto ya fue convertido antes de la demo
-- (raro pero posible). NO implica que el prospecto sea cliente.
CREATE TABLE IF NOT EXISTS public.demos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  software_type    software_type_enum NOT NULL DEFAULT 'Web App',
  description      TEXT,
  objective        TEXT,
  demo_url         TEXT,
  status           TEXT NOT NULL DEFAULT 'Pendiente',
  -- Pendiente | Programada | Presentada | Interesado |
  -- Solicita cambios | No interesado | Convertida a proyecto | Cancelada
  presented_at     TIMESTAMPTZ,
  assigned_to      UUID,         -- FK lógica a auth.users / profiles
  observations     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demos_lead_id    ON public.demos(lead_id);
CREATE INDEX IF NOT EXISTS idx_demos_client_id  ON public.demos(client_id);
CREATE INDEX IF NOT EXISTS idx_demos_status     ON public.demos(status);
CREATE INDEX IF NOT EXISTS idx_demos_created_at ON public.demos(created_at DESC);

DROP TRIGGER IF EXISTS trigger_set_demos_updated_at ON public.demos;
CREATE TRIGGER trigger_set_demos_updated_at
  BEFORE UPDATE ON public.demos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demos_select_authenticated"  ON public.demos;
CREATE POLICY "demos_select_authenticated"
  ON public.demos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "demos_insert_authenticated"  ON public.demos;
CREATE POLICY "demos_insert_authenticated"
  ON public.demos FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "demos_update_authenticated"  ON public.demos;
CREATE POLICY "demos_update_authenticated"
  ON public.demos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "demos_delete_admin"          ON public.demos;
CREATE POLICY "demos_delete_admin"
  ON public.demos FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

-- Auditoría en demos
DROP TRIGGER IF EXISTS trigger_audit_demos ON public.demos;
CREATE TRIGGER trigger_audit_demos
  AFTER INSERT OR UPDATE OR DELETE ON public.demos
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA: demo_feedback
-- ─────────────────────────────────────────────────────────────
-- Historial de feedback por demo. Nunca se borran registros.
CREATE TABLE IF NOT EXISTS public.demo_feedback (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id          UUID NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
  feedback_type    TEXT NOT NULL DEFAULT 'Comentario',
  -- Comentario | Solicitud de cambio | Objeción | Resultado | Confirmación
  comment          TEXT NOT NULL,
  requested_change TEXT,
  outcome          TEXT,
  -- Interesado | No interesado | Requiere ajustes | Aprobada | (null)
  created_by       UUID,         -- FK lógica a auth.users
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_feedback_demo_id ON public.demo_feedback(demo_id);

DROP TRIGGER IF EXISTS trigger_set_demo_feedback_updated_at ON public.demo_feedback;
CREATE TRIGGER trigger_set_demo_feedback_updated_at
  BEFORE UPDATE ON public.demo_feedback
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.demo_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_feedback_all_authenticated" ON public.demo_feedback;
CREATE POLICY "demo_feedback_all_authenticated"
  ON public.demo_feedback FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3. TABLA: proposals
-- ─────────────────────────────────────────────────────────────
-- Una propuesta puede venir de un lead, una demo o un cliente
-- ya existente. Todas las FK son opcionales.
CREATE TABLE IF NOT EXISTS public.proposals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number  TEXT UNIQUE,            -- ej. RSD-PROP-2026-001 (generado en app)
  lead_id          UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  demo_id          UUID REFERENCES public.demos(id) ON DELETE SET NULL,
  client_id        UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  scope            TEXT,
  price            NUMERIC(12,2),
  discount         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total            NUMERIC(12,2),          -- calculado en app: price - discount
  currency         TEXT NOT NULL DEFAULT 'USD',
  valid_until      TIMESTAMPTZ,
  status           TEXT NOT NULL DEFAULT 'Borrador',
  -- Borrador | Enviada | Vista | En negociación | Aceptada | Rechazada | Vencida | Cancelada
  rejection_reason TEXT,
  document_url     TEXT,
  notes            TEXT,
  sent_at          TIMESTAMPTZ,
  accepted_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_lead_id    ON public.proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_demo_id    ON public.proposals(demo_id);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id  ON public.proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status     ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at DESC);

DROP TRIGGER IF EXISTS trigger_set_proposals_updated_at ON public.proposals;
CREATE TRIGGER trigger_set_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposals_select_authenticated" ON public.proposals;
CREATE POLICY "proposals_select_authenticated"
  ON public.proposals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "proposals_insert_authenticated" ON public.proposals;
CREATE POLICY "proposals_insert_authenticated"
  ON public.proposals FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "proposals_update_authenticated" ON public.proposals;
CREATE POLICY "proposals_update_authenticated"
  ON public.proposals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "proposals_delete_admin" ON public.proposals;
CREATE POLICY "proposals_delete_admin"
  ON public.proposals FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

DROP TRIGGER IF EXISTS trigger_audit_proposals ON public.proposals;
CREATE TRIGGER trigger_audit_proposals
  AFTER INSERT OR UPDATE OR DELETE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- ─────────────────────────────────────────────────────────────
-- 4. SECUENCIA para numeración de propuestas
-- ─────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.proposal_number_seq START 1;

-- ─────────────────────────────────────────────────────────────
-- 5. TABLA: projects
-- ─────────────────────────────────────────────────────────────
-- Representa el desarrollo real contratado. client_id es la
-- única FK obligatoria. proposal_id y demo_id son opcionales
-- para trazabilidad.
-- Estados: deliberadamente como TEXT (no ENUM) para poder
-- extender sin migraciones adicionales.
CREATE TABLE IF NOT EXISTS public.projects (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code             TEXT UNIQUE,    -- ej. RSD-2026-001 (generado en app)
  name                     TEXT NOT NULL,
  description              TEXT,
  scope                    TEXT,
  client_id                UUID NOT NULL REFERENCES public.clients(id),
  proposal_id              UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  demo_id                  UUID REFERENCES public.demos(id) ON DELETE SET NULL,
  software_type            software_type_enum,
  price                    NUMERIC(12,2),
  currency                 TEXT NOT NULL DEFAULT 'USD',
  status                   TEXT NOT NULL DEFAULT 'Pendiente de inicio',
  -- Pendiente de inicio | Planificación | Diseño | Desarrollo |
  -- Pruebas internas | Revisión del cliente | Correcciones |
  -- Listo para entrega | Entregado | Aceptado |
  -- Pendiente de pago | Pagado | Mantenimiento | Finalizado | Cancelado
  start_date               TIMESTAMPTZ,
  estimated_delivery_date  TIMESTAMPTZ,
  actual_delivery_date     TIMESTAMPTZ,
  production_url           TEXT,
  repository_url           TEXT,
  assigned_to              UUID,           -- FK lógica a auth.users
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_client_id   ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_proposal_id ON public.projects(proposal_id);
CREATE INDEX IF NOT EXISTS idx_projects_status      ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at  ON public.projects(created_at DESC);

DROP TRIGGER IF EXISTS trigger_set_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_authenticated" ON public.projects;
CREATE POLICY "projects_select_authenticated"
  ON public.projects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "projects_insert_authenticated" ON public.projects;
CREATE POLICY "projects_insert_authenticated"
  ON public.projects FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "projects_update_authenticated" ON public.projects;
CREATE POLICY "projects_update_authenticated"
  ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "projects_delete_admin" ON public.projects;
CREATE POLICY "projects_delete_admin"
  ON public.projects FOR DELETE TO authenticated
  USING (public.get_user_role() = 'admin');

DROP TRIGGER IF EXISTS trigger_audit_projects ON public.projects;
CREATE TRIGGER trigger_audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- ─────────────────────────────────────────────────────────────
-- 6. SECUENCIA para numeración de proyectos
-- ─────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.project_number_seq START 1;

-- ─────────────────────────────────────────────────────────────
-- 7. ACTUALIZAR audit_logs para nuevas tablas
-- ─────────────────────────────────────────────────────────────
-- El trigger handle_audit_log ya existe y funciona genéricamente.
-- Solo necesita aplicarse a las nuevas tablas (ya hecho arriba).

-- =============================================================
-- FIN MIGRACIÓN 003
-- =============================================================
