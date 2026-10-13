-- =============================================================
-- MIGRACIÓN: EXTENDER CAMPOS DE COMPANY_DNA Y DEMOS
-- RSD Solutions CRM — 13/10/2026
-- =============================================================

-- 1. Campos enriquecidos para company_dna que integran toda la info del cliente y del diagnóstico
ALTER TABLE public.company_dna
  ADD COLUMN IF NOT EXISTS products_services    TEXT,
  ADD COLUMN IF NOT EXISTS team_size            TEXT,
  ADD COLUMN IF NOT EXISTS branches_locations   TEXT,
  ADD COLUMN IF NOT EXISTS digitalization_level TEXT,
  ADD COLUMN IF NOT EXISTS secondary_pains      TEXT,
  ADD COLUMN IF NOT EXISTS bottlenecks          TEXT,
  ADD COLUMN IF NOT EXISTS risks_losses         TEXT,
  ADD COLUMN IF NOT EXISTS urgency_priority     TEXT,
  ADD COLUMN IF NOT EXISTS expected_outcome     TEXT,
  ADD COLUMN IF NOT EXISTS proposed_solution    TEXT,
  ADD COLUMN IF NOT EXISTS user_roles           TEXT,
  ADD COLUMN IF NOT EXISTS data_migration_notes TEXT,
  ADD COLUMN IF NOT EXISTS technical_risks      TEXT,
  ADD COLUMN IF NOT EXISTS contact_person       TEXT,
  ADD COLUMN IF NOT EXISTS contact_role         TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone        TEXT,
  ADD COLUMN IF NOT EXISTS contact_email        TEXT,
  ADD COLUMN IF NOT EXISTS location             TEXT,
  ADD COLUMN IF NOT EXISTS reference_budget     TEXT;

-- 2. Asegurar campos adicionales en demos
ALTER TABLE public.demos
  ADD COLUMN IF NOT EXISTS scheduled_at         TIMESTAMPTZ;
