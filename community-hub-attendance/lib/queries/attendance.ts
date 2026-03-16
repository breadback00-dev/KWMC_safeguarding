import { supabase } from '@/lib/supabase/server';
import type { PresentChild } from '@/types';

/** Count of children who checked in AND have since been collected (check_out_time set). */
export async function getCollectedCount(sessionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .not('checked_in_at', 'is', null)
    .not('check_out_time', 'is', null);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Returns children who have checked in during the given session
 * and have not yet checked out.
 */
export async function getPresentChildren(sessionId: string): Promise<PresentChild[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      id,
      child_id,
      children (
        id,
        name
      )
    `)
    .eq('session_id', sessionId)
    .not('checked_in_at', 'is', null)
    .is('check_out_time', null);

  if (error || !data) return [];

  return (data as any[]).map(row => ({
    id: row.child_id as string,
    name: (row.children as { name: string } | null)?.name ?? 'Unknown',
    attendance_id: row.id as string,
  }));
}
