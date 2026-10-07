-- Corrige el error "FOR UPDATE is not allowed with aggregate functions"
-- en la función de reserva atómica de reuniones.

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

  -- 2. Bloqueo pesimista: bloqueamos el perfil del host para serializar las reservas y evitar doble reserva.
  -- Esto sustituye el uso de FOR UPDATE con COUNT(*) que no está permitido.
  PERFORM 1 FROM public.profiles WHERE id = p_host_id FOR UPDATE;

  -- 3. Comprobación de colisiones en reuniones activas
  -- Se excluyen reuniones 'Cancelada' o 'No asistió'
  SELECT COUNT(*)
  INTO v_conflict_count
  FROM public.meetings
  WHERE host_id = p_host_id
    AND status NOT IN ('Cancelada', 'No asistió')
    AND (
      (p_start_time >= start_time AND p_start_time < end_time) OR
      (p_end_time > start_time AND p_end_time <= end_time) OR
      (p_start_time <= start_time AND p_end_time >= end_time)
    );

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'CONFLICTO_HORARIO: El horario seleccionado ya ha sido reservado por otro usuario. Por favor seleccione otro horario disponible.';
  END IF;

  -- 4. Comprobar si hay un bloqueo no disponible de Robinson
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

  -- 5. Insertar la reunión
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

  -- 6. Si está asociada a un lead, actualizar su fecha y estado de cita
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
