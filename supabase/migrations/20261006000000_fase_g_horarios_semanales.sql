-- =============================================================
-- MIGRACIÓN FASE G: HORARIOS SEMANALES
-- =============================================================

CREATE TABLE IF NOT EXISTS public.weekly_schedules (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id),
  day_of_week         INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7), -- 1=Lunes, 7=Domingo
  start_time          TIME NOT NULL,
  end_time            TIME NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_weekly_time CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_weekly_user ON public.weekly_schedules(user_id);

DROP TRIGGER IF EXISTS trigger_set_weekly_updated_at ON public.weekly_schedules;
CREATE TRIGGER trigger_set_weekly_updated_at
  BEFORE UPDATE ON public.weekly_schedules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.weekly_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "weekly_select_auth" ON public.weekly_schedules;
CREATE POLICY "weekly_select_auth" ON public.weekly_schedules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "weekly_admin_write" ON public.weekly_schedules;
CREATE POLICY "weekly_admin_write" ON public.weekly_schedules FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');
