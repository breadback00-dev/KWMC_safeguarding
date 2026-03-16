import { supabase } from '@/lib/supabase/server';
import type { Child } from '@/types';

/** Returns a single child by id, or null if not found. */
export async function getChildById(childId: string): Promise<Child | null> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .single();

  if (error || !data) return null;
  return data as Child;
}

/** Returns all active children ordered alphabetically. */
export async function getActiveChildren(): Promise<Child[]> {
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data as Child[];
}

/**
 * Returns active children who have NO check-in record for the given session.
 * Used on the dashboard to surface unaccounted-for children.
 */
export async function getNotArrivedChildren(sessionId: string): Promise<Child[]> {
  // Get child IDs who have an attendance record for this session
  const { data: attended } = await supabase
    .from('attendance')
    .select('child_id')
    .eq('session_id', sessionId)
    .not('checked_in_at', 'is', null);

  const attendedIds = (attended ?? []).map((r: any) => r.child_id as string);

  // All active children NOT in that set
  let query = supabase
    .from('children')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true });

  if (attendedIds.length > 0) {
    query = query.not('id', 'in', `(${attendedIds.join(',')})`);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as Child[];
}
