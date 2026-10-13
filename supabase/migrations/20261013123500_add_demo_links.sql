-- =============================================================
-- MIGRACIÓN: AGREGAR ENLACES TÉCNICOS (VERCEL, GITHUB, DB) A DEMOS
-- RSD Solutions CRM — 13/10/2026
-- =============================================================

ALTER TABLE public.demos
  ADD COLUMN IF NOT EXISTS vercel_url    TEXT,
  ADD COLUMN IF NOT EXISTS github_url    TEXT,
  ADD COLUMN IF NOT EXISTS database_url  TEXT;
