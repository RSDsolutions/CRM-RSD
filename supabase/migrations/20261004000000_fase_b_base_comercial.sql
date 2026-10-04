-- =============================================================
-- MIGRACIÓN FASE B: BASE COMERCIAL, SEGUIMIENTO Y AGENDA COMPARTIDA
-- RSD Solutions CRM — 04/10/2026
-- =============================================================
-- 100% aditiva y compatible con datos existentes.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ENRIQUECER TABLA LEADS (Campos de Prospección Avanzada)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS legal_name                 TEXT,
  ADD COLUMN IF NOT EXISTS tax_id                    TEXT,
  ADD COLUMN IF NOT EXISTS city                      TEXT,
  ADD COLUMN IF NOT EXISTS province                  TEXT,
  ADD COLUMN IF NOT EXISTS website                   TEXT,
  ADD COLUMN IF NOT EXISTS social_media              TEXT,
  ADD COLUMN IF NOT EXISTS contact_role              TEXT,
  ADD COLUMN IF NOT EXISTS niche                     TEXT, -- Clínica / consultorio, Distribuidora / mayorista, etc.
  ADD COLUMN IF NOT EXISTS campaign                  TEXT,
  ADD COLUMN IF NOT EXISTS main_need                 TEXT,
  ADD COLUMN IF NOT EXISTS problem_description       TEXT,
  ADD COLUMN IF NOT EXISTS current_management_method TEXT, -- Excel, cuaderno, WhatsApp, software, manual, otro
  ADD COLUMN IF NOT EXISTS team_size                 TEXT,
  ADD COLUMN IF NOT EXISTS reference_budget          TEXT,
  ADD COLUMN IF NOT EXISTS next_action               TEXT,
  ADD COLUMN IF NOT EXISTS next_followup_date        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_preference        TEXT,
  ADD COLUMN IF NOT EXISTS is_archived               BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_leads_niche ON public.leads(niche);
CREATE INDEX IF NOT EXISTS idx_leads_next_followup ON public.leads(next_followup_date);
CREATE INDEX IF NOT EXISTS idx_leads_archived ON public.leads(is_archived);

-- ─────────────────────────────────────────────────────────────
-- 2. ACTIVIDADES Y SEGUIMIENTO PERMANENTE (activities)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id           UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id          UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  activity_type       TEXT NOT NULL,
  -- Llamada, WhatsApp, Correo, Reunión, Diagnóstico, Presentación demo,
  -- Seguimiento propuesta, Seguimiento proyecto, Seguimiento satisfacción,
  -- Renovación, Referido, Nota interna, Otro
  activity_date       TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id             UUID REFERENCES public.profiles(id),
  summary             TEXT NOT NULL,
  result              TEXT,
  next_step           TEXT,
  next_followup_date  TIMESTAMPTZ,
  visibility          TEXT NOT NULL DEFAULT 'Interno', -- Interno, Compartible
  status              TEXT NOT NULL DEFAULT 'Realizada', -- Planificada, Realizada, Cancelada, Reprogramada
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON public.activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_client_id ON public.activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON public.activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities(user_id);

DROP TRIGGER IF EXISTS trigger_set_activities_updated_at ON public.activities;
CREATE TRIGGER trigger_set_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select_auth" ON public.activities;
CREATE POLICY "activities_select_auth" ON public.activities FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "activities_insert_auth" ON public.activities;
CREATE POLICY "activities_insert_auth" ON public.activities FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "activities_update_auth" ON public.activities;
CREATE POLICY "activities_update_auth" ON public.activities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "activities_delete_admin" ON public.activities;
CREATE POLICY "activities_delete_admin" ON public.activities FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

DROP TRIGGER IF EXISTS trigger_audit_activities ON public.activities;
CREATE TRIGGER trigger_audit_activities
  AFTER INSERT OR UPDATE OR DELETE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- ─────────────────────────────────────────────────────────────
-- 3. TAREAS GLOBALES Y ASOCIADAS (tasks)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT,
  category            TEXT NOT NULL DEFAULT 'Comercial',
  priority            TEXT NOT NULL DEFAULT 'Media', -- Baja, Media, Alta, Crítica
  status              TEXT NOT NULL DEFAULT 'Pendiente', -- Pendiente, En progreso, Bloqueada, Completada, Cancelada
  assigned_to         UUID REFERENCES public.profiles(id),
  created_by          UUID REFERENCES public.profiles(id),
  due_date            TIMESTAMPTZ,
  lead_id             UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id           UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id          UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  completed_at        TIMESTAMPTZ,
  cancel_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON public.tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON public.tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);

DROP TRIGGER IF EXISTS trigger_set_tasks_updated_at ON public.tasks;
CREATE TRIGGER trigger_set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tasks_select_auth" ON public.tasks;
CREATE POLICY "tasks_select_auth" ON public.tasks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tasks_insert_auth" ON public.tasks;
CREATE POLICY "tasks_insert_auth" ON public.tasks FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "tasks_update_auth" ON public.tasks;
CREATE POLICY "tasks_update_auth" ON public.tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tasks_delete_admin" ON public.tasks;
CREATE POLICY "tasks_delete_admin" ON public.tasks FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

DROP TRIGGER IF EXISTS trigger_audit_tasks ON public.tasks;
CREATE TRIGGER trigger_audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- ─────────────────────────────────────────────────────────────
-- 4. DISPONIBILIDAD Y BLOQUEOS DE ROBINSON (availability_blocks)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.availability_blocks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id),
  title               TEXT NOT NULL DEFAULT 'Disponible',
  slot_type           TEXT NOT NULL DEFAULT 'Diagnóstico',
  -- Diagnóstico, Presentación Demo, General, Bloqueo Personal, Reunión Interna
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,
  is_available        BOOLEAN NOT NULL DEFAULT true,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_block_time CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_avail_user_time ON public.availability_blocks(user_id, start_time, end_time);

DROP TRIGGER IF EXISTS trigger_set_availability_updated_at ON public.availability_blocks;
CREATE TRIGGER trigger_set_availability_updated_at
  BEFORE UPDATE ON public.availability_blocks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.availability_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "avail_select_auth" ON public.availability_blocks;
CREATE POLICY "avail_select_auth" ON public.availability_blocks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "avail_admin_write" ON public.availability_blocks;
CREATE POLICY "avail_admin_write" ON public.availability_blocks FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 5. REUNIONES Y RESERVAS ATÓMICAS (meetings)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meetings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  meeting_type        TEXT NOT NULL DEFAULT 'Diagnóstico',
  -- Diagnóstico, Presentación de Demo, Revisión de Propuesta, Seguimiento, Reunión de Proyecto, Soporte, Otro
  host_id             UUID NOT NULL REFERENCES public.profiles(id),
  lead_id             UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id           UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id          UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  advisor_id          UUID NOT NULL REFERENCES public.profiles(id),
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,
  modality            TEXT NOT NULL DEFAULT 'Virtual', -- Virtual, Presencial
  meeting_url         TEXT,
  location            TEXT,
  status              TEXT NOT NULL DEFAULT 'Confirmada',
  -- Solicitada, Confirmada, Realizada, No asistió, Cancelada, Reprogramada
  objective           TEXT,
  notes               TEXT,
  result              TEXT,
  next_steps          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_meeting_time CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_meetings_host_time ON public.meetings(host_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON public.meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON public.meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_advisor ON public.meetings(advisor_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);

DROP TRIGGER IF EXISTS trigger_set_meetings_updated_at ON public.meetings;
CREATE TRIGGER trigger_set_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meetings_select_auth" ON public.meetings;
CREATE POLICY "meetings_select_auth" ON public.meetings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "meetings_insert_auth" ON public.meetings;
CREATE POLICY "meetings_insert_auth" ON public.meetings FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "meetings_update_auth" ON public.meetings;
CREATE POLICY "meetings_update_auth" ON public.meetings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "meetings_delete_admin" ON public.meetings;
CREATE POLICY "meetings_delete_admin" ON public.meetings FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

DROP TRIGGER IF EXISTS trigger_audit_meetings ON public.meetings;
CREATE TRIGGER trigger_audit_meetings
  AFTER INSERT OR UPDATE OR DELETE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- ─────────────────────────────────────────────────────────────
-- 6. FUNCIÓN ATÓMICA DE RESERVA DE REUNIÓN (Anti Doble Reserva)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.book_meeting_slot(
  p_title         TEXT,
  p_meeting_type  TEXT,
  p_host_id       UUID,
  p_advisor_id    UUID,
  p_lead_id       UUID,
  p_client_id     UUID,
  p_project_id    UUID,
  p_start_time    TIMESTAMPTZ,
  p_end_time      TIMESTAMPTZ,
  p_modality      TEXT,
  p_meeting_url   TEXT,
  p_objective     TEXT,
  p_notes         TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conflict_count INTEGER;
  v_new_meeting_id UUID;
BEGIN
  -- 1. Validar que la hora final sea mayor a la inicial
  IF p_end_time <= p_start_time THEN
    RAISE EXCEPTION 'La hora de finalización debe ser posterior a la de inicio.';
  END IF;

  -- 2. Bloqueo pesimista y comprobación de colisiones en reuniones activas
  -- Se excluyen reuniones 'Cancelada'
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM public.meetings
  WHERE host_id = p_host_id
    AND status NOT IN ('Cancelada', 'No asistió')
    AND (
      (p_start_time >= start_time AND p_start_time < end_time) OR
      (p_end_time > start_time AND p_end_time <= end_time) OR
      (p_start_time <= start_time AND p_end_time >= end_time)
    )
  FOR UPDATE;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'CONFLICTO_HORARIO: El horario seleccionado ya ha sido reservado por otro usuario. Por favor seleccione otro horario disponible.';
  END IF;

  -- 3. Comprobar si hay un bloqueo no disponible de Robinson
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM public.availability_blocks
  WHERE user_id = p_host_id
    AND is_available = false
    AND (
      (p_start_time >= start_time AND p_start_time < end_time) OR
      (p_end_time > start_time AND p_end_time <= end_time) OR
      (p_start_time <= start_time AND p_end_time >= end_time)
    );

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'HORARIO_BLOQUEADO: El anfitrión tiene un bloqueo de no disponibilidad programado en este rango.';
  END IF;

  -- 4. Insertar la reunión
  INSERT INTO public.meetings (
    title,
    meeting_type,
    host_id,
    advisor_id,
    lead_id,
    client_id,
    project_id,
    start_time,
    end_time,
    modality,
    meeting_url,
    objective,
    notes,
    status
  )
  VALUES (
    p_title,
    p_meeting_type,
    p_host_id,
    p_advisor_id,
    p_lead_id,
    p_client_id,
    p_project_id,
    p_start_time,
    p_end_time,
    COALESCE(p_modality, 'Virtual'),
    p_meeting_url,
    p_objective,
    p_notes,
    'Confirmada'
  )
  RETURNING id INTO v_new_meeting_id;

  -- 5. Si está asociada a un lead, actualizar su fecha y estado de cita
  IF p_lead_id IS NOT NULL THEN
    UPDATE public.leads
    SET appointment_scheduled = true,
        appointment_date = p_start_time,
        updated_at = now()
    WHERE id = p_lead_id;
  END IF;

  RETURN v_new_meeting_id;
END;
$$;
