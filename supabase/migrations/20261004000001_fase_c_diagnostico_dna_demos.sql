-- =============================================================
-- MIGRACIÓN FASE C: DIAGNÓSTICO, ADN DE EMPRESA, DEMOS, ARCHIVOS .MD Y TOKENS IA
-- RSD Solutions CRM — 04/10/2026
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. TABLA: diagnostics (Formulario de Diagnóstico de Robinson)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diagnostics (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id               UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  meeting_id              UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  advisor_id              UUID REFERENCES public.profiles(id),
  conducted_by            UUID REFERENCES public.profiles(id), -- Robinson
  status                  TEXT NOT NULL DEFAULT 'Borrador', -- Borrador, Completado
  
  -- Información del Negocio
  business_activity       TEXT,
  business_model          TEXT,
  products_services       TEXT,
  team_size               TEXT,
  branches                TEXT,
  current_tools           TEXT,
  digitalization_level    TEXT,

  -- Problema y Necesidad
  main_problem            TEXT,
  secondary_problems      TEXT,
  current_workflow        TEXT,
  bottlenecks             TEXT,
  risks_losses            TEXT,
  urgency_priority        TEXT,
  expected_outcome        TEXT,

  -- Solución Preliminar
  proposed_solution       TEXT,
  potential_modules       TEXT,
  user_roles              TEXT,
  required_integrations   TEXT,
  data_migration          TEXT,
  restrictions            TEXT,
  pending_validation      TEXT,

  -- Viabilidad y Acuerdos
  preliminary_feasibility TEXT, -- Alta, Media, Condicionada, No viable
  technical_risks         TEXT,
  client_pending_info     TEXT,
  next_action             TEXT,
  requires_demo           BOOLEAN NOT NULL DEFAULT true,
  internal_notes          TEXT,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnostics_lead_id ON public.diagnostics(lead_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_meeting ON public.diagnostics(meeting_id);

DROP TRIGGER IF EXISTS trigger_set_diagnostics_updated_at ON public.diagnostics;
CREATE TRIGGER trigger_set_diagnostics_updated_at
  BEFORE UPDATE ON public.diagnostics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "diagnostics_select_auth" ON public.diagnostics;
CREATE POLICY "diagnostics_select_auth" ON public.diagnostics FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "diagnostics_insert_auth" ON public.diagnostics;
CREATE POLICY "diagnostics_insert_auth" ON public.diagnostics FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "diagnostics_update_auth" ON public.diagnostics;
CREATE POLICY "diagnostics_update_auth" ON public.diagnostics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "diagnostics_delete_admin" ON public.diagnostics;
CREATE POLICY "diagnostics_delete_admin" ON public.diagnostics FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

DROP TRIGGER IF EXISTS trigger_audit_diagnostics ON public.diagnostics;
CREATE TRIGGER trigger_audit_diagnostics
  AFTER INSERT OR UPDATE OR DELETE ON public.diagnostics
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA: company_dna (ADN de la Empresa / Cliente)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_dna (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id               UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  version                 INTEGER NOT NULL DEFAULT 1,
  business_name           TEXT NOT NULL,
  industry_niche          TEXT,
  business_overview       TEXT,
  target_audience         TEXT,
  business_model          TEXT,
  operational_flow        TEXT,
  current_tools           TEXT,
  identified_pain_points  TEXT,
  desired_modules         TEXT,
  required_integrations   TEXT,
  visual_identity_notes   TEXT,
  design_preferences      TEXT,
  reference_systems       TEXT,
  constraints_budget      TEXT,
  -- Contexto consolidado del negocio (Markdown estructurado para redacción manual del prompt por el asesor)
  consolidated_context    TEXT,
  status                  TEXT NOT NULL DEFAULT 'Preliminar', -- Preliminar, Confirmado, En validación
  updated_by              UUID REFERENCES public.profiles(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dna_lead_id ON public.company_dna(lead_id);
CREATE INDEX IF NOT EXISTS idx_dna_client_id ON public.company_dna(client_id);

DROP TRIGGER IF EXISTS trigger_set_company_dna_updated_at ON public.company_dna;
CREATE TRIGGER trigger_set_company_dna_updated_at
  BEFORE UPDATE ON public.company_dna
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.company_dna ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_dna_select_auth" ON public.company_dna;
CREATE POLICY "company_dna_select_auth" ON public.company_dna FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "company_dna_insert_auth" ON public.company_dna;
CREATE POLICY "company_dna_insert_auth" ON public.company_dna FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "company_dna_update_auth" ON public.company_dna;
CREATE POLICY "company_dna_update_auth" ON public.company_dna FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "company_dna_delete_admin" ON public.company_dna;
CREATE POLICY "company_dna_delete_admin" ON public.company_dna FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

DROP TRIGGER IF EXISTS trigger_audit_company_dna ON public.company_dna;
CREATE TRIGGER trigger_audit_company_dna
  AFTER INSERT OR UPDATE OR DELETE ON public.company_dna
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- ─────────────────────────────────────────────────────────────
-- 3. TABLA: feasibility_reviews (Viabilidad del Proyecto)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feasibility_reviews (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                 UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id               UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  problem_to_solve        TEXT,
  preliminary_scope       TEXT,
  estimated_complexity    TEXT NOT NULL DEFAULT 'Media', -- Baja, Media, Alta, Muy Alta
  required_modules        TEXT,
  integrations            TEXT,
  external_dependencies   TEXT,
  technical_risks         TEXT,
  operational_risks       TEXT,
  estimated_timeline      TEXT,
  preliminary_price_range TEXT,
  technical_notes         TEXT,
  commercial_notes        TEXT,
  recommendation          TEXT NOT NULL DEFAULT 'Viable', -- Viable, Viable con condiciones, Requiere más información, No viable
  robinson_decision       TEXT, -- Aprobado para Demo, Rechazado, Requiere aclaraciones
  conditions_justification TEXT,
  reviewed_by             UUID REFERENCES public.profiles(id),
  reviewed_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feasibility_lead ON public.feasibility_reviews(lead_id);

ALTER TABLE public.feasibility_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feasibility_select_auth" ON public.feasibility_reviews;
CREATE POLICY "feasibility_select_auth" ON public.feasibility_reviews FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "feasibility_write_auth" ON public.feasibility_reviews;
CREATE POLICY "feasibility_write_auth" ON public.feasibility_reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 4. AMPLIAR TABLA demos (Ciclo de Vida, Versiones y Criterios)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.demos
  ADD COLUMN IF NOT EXISTS approval_status          TEXT NOT NULL DEFAULT 'Borrador',
  ADD COLUMN IF NOT EXISTS approved_by              UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS approved_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_notes           TEXT,
  ADD COLUMN IF NOT EXISTS demo_version             INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS dna_version_used         INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS diagnostic_id            UUID REFERENCES public.diagnostics(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS functional_description   TEXT,
  ADD COLUMN IF NOT EXISTS modules_included         TEXT,
  ADD COLUMN IF NOT EXISTS main_flows               TEXT,
  ADD COLUMN IF NOT EXISTS target_roles             TEXT,
  ADD COLUMN IF NOT EXISTS visual_identity_received TEXT,
  ADD COLUMN IF NOT EXISTS design_references        TEXT,
  ADD COLUMN IF NOT EXISTS test_data_used           TEXT,
  ADD COLUMN IF NOT EXISTS known_limitations        TEXT,
  ADD COLUMN IF NOT EXISTS acceptance_criteria      TEXT,
  ADD COLUMN IF NOT EXISTS client_feedback_decision TEXT, -- Aceptada | Aceptada con ajustes | Pendiente | Rechazada
  ADD COLUMN IF NOT EXISTS client_feedback_notes    TEXT,
  ADD COLUMN IF NOT EXISTS client_feedback_date     TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_demos_approval ON public.demos(approval_status);

-- ─────────────────────────────────────────────────────────────
-- 5. TABLA: demo_files (Archivos .md y Documentación de Demo)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.demo_files (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id                 UUID NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
  file_name               TEXT NOT NULL,
  file_type               TEXT NOT NULL DEFAULT 'markdown', -- markdown, text, spec
  file_content            TEXT, -- Contenido textual seguro (.md)
  file_size_bytes         INTEGER NOT NULL DEFAULT 0,
  is_required_by_robinson BOOLEAN NOT NULL DEFAULT false,
  status                  TEXT NOT NULL DEFAULT 'Recibido', -- Requerido, Recibido, Revisado, Observado, Aprobado
  robinson_observations   TEXT,
  version                 INTEGER NOT NULL DEFAULT 1,
  uploaded_by             UUID REFERENCES public.profiles(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demo_files_demo_id ON public.demo_files(demo_id);

DROP TRIGGER IF EXISTS trigger_set_demo_files_updated_at ON public.demo_files;
CREATE TRIGGER trigger_set_demo_files_updated_at
  BEFORE UPDATE ON public.demo_files
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.demo_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "demo_files_select_auth" ON public.demo_files;
CREATE POLICY "demo_files_select_auth" ON public.demo_files FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "demo_files_insert_auth" ON public.demo_files;
CREATE POLICY "demo_files_insert_auth" ON public.demo_files FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "demo_files_update_auth" ON public.demo_files;
CREATE POLICY "demo_files_update_auth" ON public.demo_files FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "demo_files_delete_admin" ON public.demo_files;
CREATE POLICY "demo_files_delete_admin" ON public.demo_files FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 6. TABLA: ai_usage_windows (Registro Manual de Tokens de IA)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_usage_windows (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id                 UUID NOT NULL REFERENCES public.demos(id) ON DELETE CASCADE,
  advisor_id              UUID NOT NULL REFERENCES public.profiles(id),
  provider                TEXT NOT NULL DEFAULT 'Claude', -- Claude, OpenAI, Antigravity, Cursor, Otro
  model                   TEXT, -- Claude 3.5 Sonnet, GPT-4o, etc.
  window_number           INTEGER NOT NULL DEFAULT 1,
  window_duration_hours   NUMERIC NOT NULL DEFAULT 5.0,
  window_start_time       TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end_time         TIMESTAMPTZ,
  percentage_consumed     INTEGER NOT NULL CHECK (percentage_consumed >= 0 AND percentage_consumed <= 100),
  work_summary            TEXT NOT NULL,
  notes                   TEXT,
  robinson_reviewed       BOOLEAN NOT NULL DEFAULT false,
  robinson_notes          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_demo ON public.ai_usage_windows(demo_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_advisor ON public.ai_usage_windows(advisor_id);

DROP TRIGGER IF EXISTS trigger_set_ai_usage_updated_at ON public.ai_usage_windows;
CREATE TRIGGER trigger_set_ai_usage_updated_at
  BEFORE UPDATE ON public.ai_usage_windows
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.ai_usage_windows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ai_usage_select_auth" ON public.ai_usage_windows;
CREATE POLICY "ai_usage_select_auth" ON public.ai_usage_windows FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ai_usage_insert_auth" ON public.ai_usage_windows;
CREATE POLICY "ai_usage_insert_auth" ON public.ai_usage_windows FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ai_usage_update_auth" ON public.ai_usage_windows;
CREATE POLICY "ai_usage_update_auth" ON public.ai_usage_windows FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "ai_usage_delete_admin" ON public.ai_usage_windows;
CREATE POLICY "ai_usage_delete_admin" ON public.ai_usage_windows FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

DROP TRIGGER IF EXISTS trigger_audit_ai_usage ON public.ai_usage_windows;
CREATE TRIGGER trigger_audit_ai_usage
  AFTER INSERT OR UPDATE OR DELETE ON public.ai_usage_windows
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
