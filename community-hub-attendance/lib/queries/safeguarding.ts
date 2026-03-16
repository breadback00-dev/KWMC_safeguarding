import { supabase } from '@/lib/supabase/server';
import type { SafeguardingIncident, SafeguardingIncidentRow } from '@/types';

/**
 * Returns all incidents for a given session, keyed by child_id for fast lookup.
 * Used on the dashboard to show warning icons.
 */
export async function getSessionIncidents(
  sessionId: string
): Promise<Map<string, SafeguardingIncident[]>> {
  const { data, error } = await supabase
    .from('safeguarding_incidents')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error || !data) return new Map();

  const map = new Map<string, SafeguardingIncident[]>();
  for (const row of data as SafeguardingIncident[]) {
    const existing = map.get(row.child_id) ?? [];
    existing.push(row);
    map.set(row.child_id, existing);
  }
  return map;
}

/**
 * For a set of present children, returns those who have ANY safeguarding
 * incidents recorded before today — used to flag prior concerns on dashboard.
 * Returns a Set of child IDs with prior concerns.
 */
export async function getChildrenWithPriorConcerns(
  childIds: string[]
): Promise<Set<string>> {
  if (!childIds.length) return new Set();

  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('safeguarding_incidents')
    .select('child_id')
    .in('child_id', childIds)
    .lt('created_at', `${today}T00:00:00`);

  return new Set((data ?? []).map((r: any) => r.child_id as string));
}

/**
 * Returns incidents for a specific session, joined with child name.
 * Used in the session hub Safeguarding tab.
 */
export async function getSessionIncidentRows(
  sessionId: string
): Promise<SafeguardingIncidentRow[]> {
  const { data, error } = await supabase
    .from('safeguarding_incidents')
    .select('*, children(name)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row: any) => ({
    ...row,
    child_name: row.children?.name ?? 'Unknown',
    children: undefined,
  })) as SafeguardingIncidentRow[];
}

/**
 * Returns all incidents across all sessions, joined with child name.
 * Used on the /safeguarding history page.
 */
export async function getAllIncidents(): Promise<SafeguardingIncidentRow[]> {
  const { data, error } = await supabase
    .from('safeguarding_incidents')
    .select('*, children(name)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((row: any) => ({
    ...row,
    child_name: row.children?.name ?? 'Unknown',
    children: undefined,
  })) as SafeguardingIncidentRow[];
}
