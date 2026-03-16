'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase/server';
import { getOrCreateTodaySession } from '@/lib/queries/sessions';
import { getAuthUser } from '@/lib/supabase/auth-server';
import type { ActionResult, SafeguardingIncident, IncidentType } from '@/types';

/** Amends the notes on an existing incident. Preserves the original as an audit trail. */
export async function amendIncident(
  incidentId: string,
  amendedNotes: string,
  sessionId: string,
): Promise<ActionResult<void>> {
  const trimmed = amendedNotes.trim();
  if (!trimmed) return { success: false, error: 'Amended notes cannot be empty.' };

  const user = await getAuthUser();

  const { error } = await supabase
    .from('safeguarding_incidents')
    .update({
      amended_notes: trimmed,
      amended_by: user?.email ?? 'staff',
      amended_at: new Date().toISOString(),
    })
    .eq('id', incidentId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath('/safeguarding');
  return { success: true, data: undefined };
}

export async function recordIncident(
  childId: string,
  incidentType: IncidentType,
  notes: string
): Promise<ActionResult<SafeguardingIncident>> {
  if (!notes.trim()) {
    return { success: false, error: 'Notes are required.' };
  }

  // 1. Resolve today's session
  let session;
  try {
    session = await getOrCreateTodaySession();
  } catch {
    return { success: false, error: 'No session available for today.' };
  }

  // 2. Find the child's active attendance record (if any)
  const { data: attendance } = await supabase
    .from('attendance')
    .select('id')
    .eq('child_id', childId)
    .eq('session_id', session.id)
    .is('check_out_time', null)
    .maybeSingle();

  // 3. Insert incident
  const { data, error } = await supabase
    .from('safeguarding_incidents')
    .insert({
      child_id: childId,
      session_id: session.id,
      attendance_id: attendance?.id ?? null,
      incident_type: incidentType,
      notes: notes.trim(),
      created_by: (await getAuthUser())?.email ?? 'staff',
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath(`/sessions/${session.id}`);
  revalidatePath('/safeguarding');

  return { success: true, data: data as SafeguardingIncident };
}
