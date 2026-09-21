-- ==========================================================
-- Mini-CRM RSD Solutions - Esquema de Base de Datos
-- Ejecutar en: Supabase SQL Editor
-- ==========================================================

-- 1. Tipos enumerados
DO $$ BEGIN
    CREATE TYPE software_type_enum AS ENUM (
        'Web App', 
        'Mobile App', 
        'E-commerce', 
        'ERP/CRM', 
        'Landing Page', 
        'Otro'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status_enum AS ENUM (
        'Nuevo', 
        'Contactado', 
        'Cita Agendada', 
        'Propuesta', 
        'Negociación', 
        'Cerrado-Ganado', 
        'Cerrado-Perdido'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabla 'leads'
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    software_type software_type_enum NOT NULL,
    interaction_log TEXT NOT NULL,
    appointment_scheduled BOOLEAN NOT NULL DEFAULT false,
    appointment_date TIMESTAMPTZ NULL,
    status lead_status_enum NOT NULL DEFAULT 'Nuevo',
    assigned_to TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Índices de rendimiento para consultas Kanban
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- 4. Trigger para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_leads_updated_at ON public.leads;
CREATE TRIGGER trigger_set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de acceso (RLS) para usuarios autenticados
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados" ON public.leads;
CREATE POLICY "Permitir lectura a usuarios autenticados" 
    ON public.leads 
    FOR SELECT 
    TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Permitir insercion a usuarios autenticados" ON public.leads;
CREATE POLICY "Permitir insercion a usuarios autenticados" 
    ON public.leads 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion a usuarios autenticados" ON public.leads;
CREATE POLICY "Permitir actualizacion a usuarios autenticados" 
    ON public.leads 
    FOR UPDATE 
    TO authenticated 
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir eliminacion a usuarios autenticados" ON public.leads;
CREATE POLICY "Permitir eliminacion a usuarios autenticados" 
    ON public.leads 
    FOR DELETE 
    TO authenticated 
    USING (true);
