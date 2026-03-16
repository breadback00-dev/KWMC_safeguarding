import { supabase } from '@/lib/supabase/server';
import type { Session } from '@/types';

/** Returns all sessions ordered newest first, with a live count of present children. */
export async function getAllSessions(): Promise<Array<Session & { present_count: number }>> {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: false })
    .order('start_time', { ascending: true });

  if (!sessions?.length) return [];

  // Count children currently present (checked in, not yet out) per session
  const { data: rows } = await supabase
    .from('attendance')
    .select('session_id')
    .in('session_id', sessions.map(s => s.id))
    .is('check_out_time', null);

  const countMap = new Map<string, number>();
  for (const row of rows ?? []) {
    countMap.set(row.session_id, (countMap.get(row.session_id) ?? 0) + 1);
  }

  return sessions.map(s => ({ ...(s as Session), present_count: countMap.get(s.id) ?? 0 }));
}

/** Returns a single session by ID, or null if not found. */
export async function getSessionById(id: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data as Session;
}

/** Returns today's first session, or null if none scheduled. */
export async function getActiveSession(): Promise<Session | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('date', today)
    .order('start_time', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Session;
}

/**
 * Returns today's session, creating one with sensible defaults if none exists.
 * Uses upsert on the UNIQUE(club_name, date, start_time) constraint so concurrent
 * calls are safe.
 */
export async function getOrCreateTodaySession(): Promise<Session> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('sessions')
    .upsert(
      {
        club_name: 'After School Club',
        date: today,
        start_time: '15:00:00',
        end_time: '17:30:00',
        capacity: 30,
      },
      { onConflict: 'club_name,date,start_time' }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to get or create today's session: ${error?.message}`);
  }

  return data as Session;
}
