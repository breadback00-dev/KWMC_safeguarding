import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getOrCreateTodaySession } from '@/lib/queries/sessions';
import { INCIDENT_TYPES } from '@/types';
import type { IncidentType } from '@/types';

const VALID_TYPES = Object.keys(INCIDENT_TYPES) as IncidentType[];

export async function POST(request: Request) {
  let body: { childId?: string; incidentType?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { childId, incidentType, notes } = body;

  if (!childId) {
    return NextResponse.json({ error: 'childId is required.' }, { status: 400 });
  }
  if (!incidentType || !VALID_TYPES.includes(incidentType as IncidentType)) {
    return NextResponse.json(
      { error: `incidentType must be one of: ${VALID_TYPES.join(', ')}.` },
      { status: 400 }
    );
  }
  if (!notes?.trim()) {
    return NextResponse.json({ error: 'notes is required.' }, { status: 400 });
  }

  // Resolve today's session
  let session;
  try {
    session = await getOrCreateTodaySession();
  } catch {
    return NextResponse.json({ error: 'No session available for today.' }, { status: 400 });
  }

  // Find active attendance record (optional — incident can exist without check-in)
  const { data: attendance } = await supabase
    .from('attendance')
    .select('id')
    .eq('child_id', childId)
    .eq('session_id', session.id)
    .is('check_out_time', null)
    .maybeSingle();

  const { data, error } = await supabase
    .from('safeguarding_incidents')
    .insert({
      child_id: childId,
      session_id: session.id,
      attendance_id: attendance?.id ?? null,
      incident_type: incidentType,
      notes: notes.trim(),
      created_by: 'staff',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    status: 'recorded',
    incidentId: data.id,
    childId,
    sessionId: session.id,
  });
}
