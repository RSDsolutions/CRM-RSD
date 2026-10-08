'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function uploadResourceAction(formData: FormData) {
  const supabase = createClient();
  const file = formData.get('file') as File;
  let title = formData.get('title') as string;
  const description = formData.get('description') as string;

  if (!file) {
    return { error: 'El archivo es obligatorio.' };
  }

  if (!title) {
    title = file.name.replace(/\.pdf$/i, '');
  }

  // Get current user profile for uploaded_by
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'No autorizado' };
  }

  // Upload file to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('resources')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    return { error: 'Error al subir el archivo.' };
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('resources')
    .getPublicUrl(filePath);

  // Save to database
  const { data, error } = await supabase
    .from('resources')
    .insert({
      title,
      description,
      file_url: publicUrlData.publicUrl,
      file_path: filePath,
      file_name: file.name,
      file_size_bytes: file.size,
      uploaded_by: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving resource metadata:', error);
    // Cleanup the uploaded file since DB insert failed
    await supabase.storage.from('resources').remove([filePath]);
    return { error: 'Error al guardar la información del recurso.' };
  }

  revalidatePath('/recursos');
  return { data };
}

export async function getResourcesAction() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('resources')
    .select(`
      *,
      profiles:uploaded_by (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching resources:', error);
    return { error: 'Error al obtener los recursos.' };
  }

  return { data };
}

export async function deleteResourceAction(id: string, filePath: string) {
  const supabase = createClient();

  const { error: dbError } = await supabase
    .from('resources')
    .delete()
    .eq('id', id);

  if (dbError) {
    console.error('Error deleting resource from DB:', dbError);
    return { error: 'Error al eliminar el recurso de la base de datos.' };
  }

  const { error: storageError } = await supabase.storage
    .from('resources')
    .remove([filePath]);

  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
    // Even if storage fails, we already deleted from DB, so it's a soft error here
  }

  revalidatePath('/recursos');
  return { success: true };
}
