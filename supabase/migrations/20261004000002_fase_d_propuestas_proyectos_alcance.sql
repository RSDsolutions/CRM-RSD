-- =============================================================
-- MIGRACIÓN FASE D: PROPUESTAS COMERCIALES, PROYECTOS Y CONTROL DE CAMBIOS DE ALCANCE
-- RSD Solutions CRM — 04/10/2026
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. AMPLIAR TABLA proposals (Tarifas, Desglose de IVA y Aprobación)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS base_amount               NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extras_amount             NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate                  NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  ADD COLUMN IF NOT EXISTS tax_amount                NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_maintenance       NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_delivery_weeks  INTEGER NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS commercial_terms          TEXT,
  ADD COLUMN IF NOT EXISTS robinson_approval_status  TEXT NOT NULL DEFAULT 'Borrador',
  -- Borrador | Pendiente aprobación | Aprobada por Robinson | Rechazada
  ADD COLUMN IF NOT EXISTS approved_by               UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at               TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS proposal_version          INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_proposals_approval ON public.proposals(robinson_approval_status);

-- ─────────────────────────────────────────────────────────────
-- 2. AMPLIAR TABLA projects (Dirección Técnica vs Asesor Comercial)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS commercial_advisor_id     UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS technical_director_id     UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS has_blocker               BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active_blocker            TEXT,
  ADD COLUMN IF NOT EXISTS scope_version             INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_projects_advisor ON public.projects(commercial_advisor_id);
CREATE INDEX IF NOT EXISTS idx_projects_blocker ON public.projects(has_blocker);

-- ─────────────────────────────────────────────────────────────
-- 3. TABLA: project_milestones (Hitos de Proyecto)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  target_date         TIMESTAMPTZ NOT NULL,
  completed_date      TIMESTAMPTZ,
  status              TEXT NOT NULL DEFAULT 'Pendiente', -- Pendiente, En progreso, Completado, Atrasado
  order_index         INTEGER NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.project_milestones(project_id);

DROP TRIGGER IF EXISTS trigger_set_milestones_updated_at ON public.project_milestones;
CREATE TRIGGER trigger_set_milestones_updated_at
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "milestones_select_auth" ON public.project_milestones;
CREATE POLICY "milestones_select_auth" ON public.project_milestones FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "milestones_write_auth" ON public.project_milestones;
CREATE POLICY "milestones_write_auth" ON public.project_milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 4. TABLA: scope_change_requests (Control de Cambios de Alcance)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scope_change_requests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  change_code              TEXT NOT NULL,
  requested_by             UUID REFERENCES public.profiles(id),
  description              TEXT NOT NULL,
  reason                   TEXT NOT NULL,
  expected_benefit         TEXT,
  affected_modules         TEXT,
  technical_impact         TEXT,
  schedule_impact_days     INTEGER NOT NULL DEFAULT 0,
  commercial_impact_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status                   TEXT NOT NULL DEFAULT 'Solicitado',
  -- Solicitado | En evaluación | Pendiente aprobación interna | Aprobado por Robinson | Aprobado por cliente | Rechazado | Implementado
  robinson_decision        TEXT,
  robinson_notes           TEXT,
  client_acceptance_date   TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scope_changes_project ON public.scope_change_requests(project_id);

DROP TRIGGER IF EXISTS trigger_set_scope_changes_updated_at ON public.scope_change_requests;
CREATE TRIGGER trigger_set_scope_changes_updated_at
  BEFORE UPDATE ON public.scope_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.scope_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scope_changes_select_auth" ON public.scope_change_requests;
CREATE POLICY "scope_changes_select_auth" ON public.scope_change_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "scope_changes_write_auth" ON public.scope_change_requests;
CREATE POLICY "scope_changes_write_auth" ON public.scope_change_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trigger_audit_scope_changes ON public.scope_change_requests;
CREATE TRIGGER trigger_audit_scope_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.scope_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
