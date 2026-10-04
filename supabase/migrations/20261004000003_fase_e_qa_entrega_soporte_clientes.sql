-- =============================================================
-- MIGRACIÓN: FASE E - CONTROL DE CALIDAD (QA), CAPACITACIÓN, 
-- SOPORTE E INCIDENCIAS, RETENCIÓN Y REFERIDOS
-- =============================================================

-- =============================================================
-- 1. CASOS DE PRUEBA Y CONTROL DE CALIDAD (qa_test_cases)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.qa_test_cases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  module_name         TEXT NOT NULL,
  test_case_title     TEXT NOT NULL,
  description         TEXT,
  expected_result     TEXT NOT NULL,
  actual_result       TEXT,
  status              TEXT NOT NULL DEFAULT 'Pendiente',
  -- 'Pendiente' | 'Aprobado' | 'Fallido' | 'Bloqueado'
  evidence_url        TEXT,
  responsible_id      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  executed_at         TIMESTAMPTZ,
  observations        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qa_test_cases_project_id ON public.qa_test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_qa_test_cases_status ON public.qa_test_cases(status);

DROP TRIGGER IF EXISTS trigger_set_qa_test_cases_updated_at ON public.qa_test_cases;
CREATE TRIGGER trigger_set_qa_test_cases_updated_at
  BEFORE UPDATE ON public.qa_test_cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.qa_test_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "qa_test_cases_select_auth" ON public.qa_test_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "qa_test_cases_insert_auth" ON public.qa_test_cases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "qa_test_cases_update_auth" ON public.qa_test_cases FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "qa_test_cases_delete_admin" ON public.qa_test_cases FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_qa_test_cases AFTER INSERT OR UPDATE OR DELETE ON public.qa_test_cases FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();


-- =============================================================
-- 2. SESIONES DE CAPACITACIÓN (training_sessions)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id            UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  session_date         TIMESTAMPTZ NOT NULL DEFAULT now(),
  modality             TEXT NOT NULL DEFAULT 'Virtual',
  -- 'Virtual' | 'Presencial'
  attendees            TEXT NOT NULL,
  topics_covered       TEXT NOT NULL,
  delivered_materials  TEXT,
  client_questions     TEXT,
  pending_items        TEXT,
  instructor_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_confirmed     BOOLEAN NOT NULL DEFAULT false,
  confirmation_notes   TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_project_id ON public.training_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_client_id ON public.training_sessions(client_id);

DROP TRIGGER IF EXISTS trigger_set_training_sessions_updated_at ON public.training_sessions;
CREATE TRIGGER trigger_set_training_sessions_updated_at
  BEFORE UPDATE ON public.training_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_sessions_select_auth" ON public.training_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "training_sessions_insert_auth" ON public.training_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "training_sessions_update_auth" ON public.training_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "training_sessions_delete_admin" ON public.training_sessions FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_training_sessions AFTER INSERT OR UPDATE OR DELETE ON public.training_sessions FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();


-- =============================================================
-- 3. TICKETS DE SOPORTE E INCIDENCIAS (support_tickets)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code              TEXT NOT NULL UNIQUE,
  client_id                UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id               UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  requester_name           TEXT NOT NULL,
  category                 TEXT NOT NULL DEFAULT 'Error en sistema',
  -- 'Error en sistema' | 'Consulta técnica' | 'Solicitud de mejora' | 'Fallo de acceso' | 'Otro'
  priority                 TEXT NOT NULL DEFAULT 'Media',
  -- 'Baja' | 'Media' | 'Alta' | 'Crítica'
  impact                   TEXT NOT NULL DEFAULT 'Medio',
  -- 'Bajo' | 'Medio' | 'Alto' | 'Bloqueo total'
  description              TEXT NOT NULL,
  evidence_url             TEXT,
  assigned_to              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status                   TEXT NOT NULL DEFAULT 'Abierto',
  -- 'Abierto' | 'En diagnóstico' | 'En resolución' | 'Resuelto' | 'Cerrado'
  diagnosis                TEXT,
  solution                 TEXT,
  resolved_at              TIMESTAMPTZ,
  client_confirmed         BOOLEAN NOT NULL DEFAULT false,
  commercial_followup_notes TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_client_id ON public.support_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_project_id ON public.support_tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);

DROP TRIGGER IF EXISTS trigger_set_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trigger_set_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_tickets_select_auth" ON public.support_tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "support_tickets_insert_auth" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "support_tickets_update_auth" ON public.support_tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "support_tickets_delete_admin" ON public.support_tickets FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_support_tickets AFTER INSERT OR UPDATE OR DELETE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();


-- =============================================================
-- 4. OPORTUNIDADES PERDIDAS Y RECUPERACIÓN (lost_opportunities)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.lost_opportunities (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                  UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  loss_reason              TEXT NOT NULL,
  stage_lost               TEXT NOT NULL,
  competitor_chosen        TEXT,
  main_objection           TEXT,
  price_or_scope_reason    TEXT,
  loss_date                TIMESTAMPTZ NOT NULL DEFAULT now(),
  responsible_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recovery_attempts_count  INTEGER NOT NULL DEFAULT 0,
  last_recovery_date       TIMESTAMPTZ,
  next_reactivation_date   DATE,
  do_not_contact           BOOLEAN NOT NULL DEFAULT false,
  recovery_status          TEXT NOT NULL DEFAULT 'En espera',
  -- 'En espera' | 'En reactivación' | 'Recuperado' | 'Definitivamente perdido'
  notes                    TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lost_opportunities_lead_id ON public.lost_opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lost_opportunities_status ON public.lost_opportunities(recovery_status);

DROP TRIGGER IF EXISTS trigger_set_lost_opportunities_updated_at ON public.lost_opportunities;
CREATE TRIGGER trigger_set_lost_opportunities_updated_at
  BEFORE UPDATE ON public.lost_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.lost_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lost_opportunities_select_auth" ON public.lost_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "lost_opportunities_insert_auth" ON public.lost_opportunities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lost_opportunities_update_auth" ON public.lost_opportunities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lost_opportunities_delete_admin" ON public.lost_opportunities FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_lost_opportunities AFTER INSERT OR UPDATE OR DELETE ON public.lost_opportunities FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();


-- =============================================================
-- 5. REFERIDOS Y ALIANZAS (referrals)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  referred_name            TEXT NOT NULL,
  referred_company         TEXT,
  referred_phone           TEXT,
  referred_email           TEXT,
  advisor_id               UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status                   TEXT NOT NULL DEFAULT 'Registrado',
  -- 'Registrado' | 'En contacto' | 'En negociación' | 'Convertido a cliente' | 'Descartado'
  incentive_authorized     BOOLEAN NOT NULL DEFAULT false,
  incentive_details        TEXT,
  followup_notes           TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_client_id ON public.referrals(referrer_client_id);
CREATE INDEX IF NOT EXISTS idx_referrals_advisor_id ON public.referrals(advisor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

DROP TRIGGER IF EXISTS trigger_set_referrals_updated_at ON public.referrals;
CREATE TRIGGER trigger_set_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals_select_auth" ON public.referrals FOR SELECT TO authenticated USING (true);
CREATE POLICY "referrals_insert_auth" ON public.referrals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "referrals_update_auth" ON public.referrals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "referrals_delete_admin" ON public.referrals FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_referrals AFTER INSERT OR UPDATE OR DELETE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
