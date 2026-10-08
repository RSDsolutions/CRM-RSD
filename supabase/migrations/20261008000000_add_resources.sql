-- Migration: Add Resources table and storage bucket

-- 1. Create Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL, -- The path or full URL
  file_path TEXT NOT NULL, -- The storage object path
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_set_resources_updated_at ON public.resources;
CREATE TRIGGER trigger_set_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS for Resources Table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "resources_select_auth" ON public.resources;
CREATE POLICY "resources_select_auth" ON public.resources FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "resources_insert_auth" ON public.resources;
CREATE POLICY "resources_insert_auth" ON public.resources FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "resources_update_admin" ON public.resources;
CREATE POLICY "resources_update_admin" ON public.resources FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'asesor', 'robinson')) WITH CHECK (true);

DROP POLICY IF EXISTS "resources_delete_admin" ON public.resources;
CREATE POLICY "resources_delete_admin" ON public.resources FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'asesor', 'robinson'));

-- 2. Create Storage Bucket for Resources
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'resources' bucket
-- Allow public access to read
DROP POLICY IF EXISTS "Public Access to Resources" ON storage.objects;
CREATE POLICY "Public Access to Resources"
ON storage.objects FOR SELECT
USING ( bucket_id = 'resources' );

-- Allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload resources" ON storage.objects;
CREATE POLICY "Authenticated users can upload resources"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'resources' );

-- Allow owners or admins to delete
DROP POLICY IF EXISTS "Users can delete their resources" ON storage.objects;
CREATE POLICY "Users can delete their resources"
ON storage.objects FOR DELETE TO authenticated
USING ( bucket_id = 'resources' );
