-- =============================================================
-- MIGRACIÓN: PRECIO ACORDADO EN DEMOS Y EXCEPCIONES EN AGENDA
-- RSD Solutions CRM — 14/10/2026
-- =============================================================

-- 1. Ampliar demos con precio acordado, forma de pago y razón de no aceptación
ALTER TABLE public.demos
  ADD COLUMN IF NOT EXISTS agreed_price          NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS is_installment        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS installments_count    INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_terms_notes   TEXT,
  ADD COLUMN IF NOT EXISTS non_acceptance_reason TEXT;

-- 2. Ampliar availability_blocks para soporte de bloqueos de día completo
ALTER TABLE public.availability_blocks
  ADD COLUMN IF NOT EXISTS is_all_day            BOOLEAN NOT NULL DEFAULT false;

-- 3. Crear índice para optimizar consultas de bloqueos por rango
CREATE INDEX IF NOT EXISTS idx_avail_blocks_range 
  ON public.availability_blocks(user_id, is_available, start_time, end_time);
