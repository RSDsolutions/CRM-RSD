-- =============================================================
-- MIGRACIÓN 004: FASE 3 - CICLO POST-PROYECTO
-- Entregas, Aceptación, Pagos, Mantenimiento, Renovación
-- =============================================================

-- ==========================================
-- 1. ENTREGAS (project_deliveries)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.project_deliveries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  delivery_number  INTEGER NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  version          TEXT,
  status           TEXT NOT NULL DEFAULT 'En revisión',
  -- Pendiente revisión | En revisión | Aceptada | Rechazada | Aceptada con observaciones
  delivery_url     TEXT,
  repository_url   TEXT,
  notes            TEXT,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, delivery_number)
);

CREATE INDEX IF NOT EXISTS idx_project_deliveries_project_id ON public.project_deliveries(project_id);

DROP TRIGGER IF EXISTS trigger_set_project_deliveries_updated_at ON public.project_deliveries;
CREATE TRIGGER trigger_set_project_deliveries_updated_at
  BEFORE UPDATE ON public.project_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.project_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deliveries_select_authenticated" ON public.project_deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "deliveries_insert_authenticated" ON public.project_deliveries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "deliveries_update_authenticated" ON public.project_deliveries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "deliveries_delete_admin" ON public.project_deliveries FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_deliveries AFTER INSERT OR UPDATE OR DELETE ON public.project_deliveries FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();


-- ==========================================
-- 2. ACEPTACIONES (project_acceptances)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.project_acceptances (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id                UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  delivery_id               UUID REFERENCES public.project_deliveries(id) ON DELETE SET NULL,
  status                    TEXT NOT NULL,
  -- Aceptada | Aceptada con observaciones | Rechazada
  accepted_by_client_name   TEXT,
  observations              TEXT,
  created_by                UUID REFERENCES public.profiles(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_acceptances_project_id ON public.project_acceptances(project_id);
CREATE INDEX IF NOT EXISTS idx_project_acceptances_delivery_id ON public.project_acceptances(delivery_id);

DROP TRIGGER IF EXISTS trigger_set_project_acceptances_updated_at ON public.project_acceptances;
CREATE TRIGGER trigger_set_project_acceptances_updated_at
  BEFORE UPDATE ON public.project_acceptances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.project_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceptances_select_authenticated" ON public.project_acceptances FOR SELECT TO authenticated USING (true);
CREATE POLICY "acceptances_insert_authenticated" ON public.project_acceptances FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "acceptances_update_authenticated" ON public.project_acceptances FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acceptances_delete_admin" ON public.project_acceptances FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_acceptances AFTER INSERT OR UPDATE OR DELETE ON public.project_acceptances FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();


-- ==========================================
-- 3. PAGOS (payments)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  proposal_id      UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
  client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount           NUMERIC(12,2) NOT NULL,
  currency         TEXT NOT NULL DEFAULT 'USD',
  payment_type     TEXT NOT NULL DEFAULT 'Único',
  -- Anticipo | Hito | Saldo final | Único
  status           TEXT NOT NULL DEFAULT 'Registrado',
  -- Pendiente | Registrado | Confirmado | Rechazado | Anulado
  payment_date     TIMESTAMPTZ,
  payment_method   TEXT,
  reference        TEXT,
  receipt_url      TEXT,
  notes            TEXT,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

DROP TRIGGER IF EXISTS trigger_set_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_authenticated" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments_insert_authenticated" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payments_update_authenticated" ON public.payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "payments_delete_admin" ON public.payments FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();


-- ==========================================
-- 4. CONTRATOS DE MANTENIMIENTO (maintenance_contracts)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.maintenance_contracts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id        UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  payment_id       UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  type             TEXT NOT NULL DEFAULT 'Incluido',
  -- Incluido | Renovación
  status           TEXT NOT NULL DEFAULT 'Pendiente',
  -- Pendiente | Activo | Por vencer | Vencido | Renovado | Cancelado
  start_date       TIMESTAMPTZ,
  end_date         TIMESTAMPTZ,
  duration_months  INTEGER NOT NULL DEFAULT 3,
  notes            TEXT,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_project_id ON public.maintenance_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_contracts(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_end_date ON public.maintenance_contracts(end_date);

DROP TRIGGER IF EXISTS trigger_set_maintenance_updated_at ON public.maintenance_contracts;
CREATE TRIGGER trigger_set_maintenance_updated_at
  BEFORE UPDATE ON public.maintenance_contracts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.maintenance_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maintenance_select_authenticated" ON public.maintenance_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "maintenance_insert_authenticated" ON public.maintenance_contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "maintenance_update_authenticated" ON public.maintenance_contracts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "maintenance_delete_admin" ON public.maintenance_contracts FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_maintenance AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_contracts FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();


-- ==========================================
-- 5. EVENTOS DE MANTENIMIENTO (maintenance_events)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.maintenance_events (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_contract_id   UUID NOT NULL REFERENCES public.maintenance_contracts(id) ON DELETE CASCADE,
  type                      TEXT NOT NULL DEFAULT 'Soporte',
  -- Soporte | Corrección | Preventivo | Incidencia | Otro
  title                     TEXT NOT NULL,
  description               TEXT,
  status                    TEXT NOT NULL DEFAULT 'Abierto',
  -- Abierto | En progreso | Resuelto | Cerrado
  priority                  TEXT NOT NULL DEFAULT 'Media',
  -- Alta | Media | Baja
  resolved_at               TIMESTAMPTZ,
  created_by                UUID REFERENCES public.profiles(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_events_contract_id ON public.maintenance_events(maintenance_contract_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_events_status ON public.maintenance_events(status);

DROP TRIGGER IF EXISTS trigger_set_maintenance_events_updated_at ON public.maintenance_events;
CREATE TRIGGER trigger_set_maintenance_events_updated_at
  BEFORE UPDATE ON public.maintenance_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.maintenance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maintenance_events_select_authenticated" ON public.maintenance_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "maintenance_events_insert_authenticated" ON public.maintenance_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "maintenance_events_update_authenticated" ON public.maintenance_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "maintenance_events_delete_admin" ON public.maintenance_events FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_maintenance_events AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_events FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();


-- ==========================================
-- 6. RENOVACIONES (renewals)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.renewals (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id               UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  maintenance_contract_id  UUID REFERENCES public.maintenance_contracts(id) ON DELETE SET NULL,
  status                   TEXT NOT NULL DEFAULT 'Contactar',
  -- Contactar | Propuesta enviada | En negociación | Renovado | No renovado
  renewal_date_target      TIMESTAMPTZ,
  amount                   NUMERIC(12,2),
  notes                    TEXT,
  created_by               UUID REFERENCES public.profiles(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_renewals_client_id ON public.renewals(client_id);
CREATE INDEX IF NOT EXISTS idx_renewals_status ON public.renewals(status);

DROP TRIGGER IF EXISTS trigger_set_renewals_updated_at ON public.renewals;
CREATE TRIGGER trigger_set_renewals_updated_at
  BEFORE UPDATE ON public.renewals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "renewals_select_authenticated" ON public.renewals FOR SELECT TO authenticated USING (true);
CREATE POLICY "renewals_insert_authenticated" ON public.renewals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "renewals_update_authenticated" ON public.renewals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "renewals_delete_admin" ON public.renewals FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

CREATE TRIGGER trigger_audit_renewals AFTER INSERT OR UPDATE OR DELETE ON public.renewals FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();
