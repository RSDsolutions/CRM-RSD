'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { Notification } from '@/types/database.types';

export async function getNotificationsAction(): Promise<Notification[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data || [];
}

export async function markNotificationAsReadAction(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  return { success: true };
}

export async function markAllNotificationsAsReadAction() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'No user' };

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  return { success: true };
}

export async function createNotificationAction(payload: {
  user_id: string;
  title: string;
  message: string;
  type?: string;
  link_url?: string;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: payload.user_id,
        title: payload.title.trim(),
        message: payload.message.trim(),
        type: payload.type || 'sistema',
        link_url: payload.link_url || null,
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, notification: data };
}
