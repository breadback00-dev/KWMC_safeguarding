/**
 * Core attendance business logic.
 * Called by both server actions (UI) and API routes (QR / external).
 * Never import revalidatePath here — callers handle cache invalidation.
 */

import { supabase } from '@/lib/supabase/server';
import { getOrCreateTodaySession } from '@/lib/queries/sessions';
import { getChildById } from '@/lib/queries/children';
import { sendSms } from '@/lib/sms/sendSms';
import type { ActionResult, Attendance } from '@/types';

// ─── Check In ─────────────────────────────────────────────────────────────────

export async function performCheckIn(
  childId: string,
  source: 'staff' | 'qr' = 'staff'
): Promise<ActionResult<Attendance>> {
  // 1. Resolve today's session
  let session;
  try {
    session = await getOrCreateTodaySession();
  } catch {
    return { success: false, error: 'No session available for today.' };
  }

  // 2. Prevent duplicate check-in
  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('child_id', childId)
    .eq('session_id', session.id)
    .is('check_out_time', null)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Child is already checked in.' };
  }

  // 3. Enforce capacity
  const { count } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session.id)
    .is('check_out_time', null);

  if (count !== null && count >= session.capacity) {
    return { success: false, error: 'Session is at full capacity.' };
  }

  // 4. Record check-in
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('attendance')
    .insert({ child_id: childId, session_id: session.id, checked_in_at: now, status: 'present' })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // 5. Safeguarding log (fire-and-forget)
  await supabase.from('safeguarding_logs').insert({
    child_id: childId,
    session_id: session.id,
    event_type: 'CHECK_IN',
    description: source === 'qr' ? 'Child checked in via QR code.' : 'Child checked in by staff.',
  });

  // 6. SMS notification (fire-and-forget — failure does not block check-in)
  const child = await getChildById(childId);
  if (child?.parent_phone) {
    const parentName = child.parent_name ?? 'Parent';
    await sendSms({
      childId,
      attendanceId: data.id,
      phoneNumber: child.parent_phone,
      message: `Hi ${parentName}, ${child.name} has safely arrived at after-school club.`,
      messageType: 'check_in',
    });
  }

  return { success: true, data: data as Attendance };
}

// ─── Check Out ────────────────────────────────────────────────────────────────

export async function performCheckOut(
  childId: string,
  source: 'staff' | 'qr' = 'staff'
): Promise<ActionResult<Attendance>> {
  // 1. Resolve today's session
  let session;
  try {
    session = await getOrCreateTodaySession();
  } catch {
    return { success: false, error: 'No session available for today.' };
  }

  const now = new Date().toISOString();

  // 2. Update active attendance record
  const { data, error } = await supabase
    .from('attendance')
    .update({ check_out_time: now })
    .eq('child_id', childId)
    .eq('session_id', session.id)
    .is('check_out_time', null)
    .select()
    .single();

  if (error || !data) {
    return { success: false, error: 'Child is not currently checked in.' };
  }

  // 3. Safeguarding log (fire-and-forget)
  await supabase.from('safeguarding_logs').insert({
    child_id: childId,
    session_id: session.id,
    event_type: 'CHECK_OUT',
    description: source === 'qr'
      ? `Child checked out at ${now} via QR code.`
      : `Child checked out at ${now}.`,
  });

  // 4. SMS notification (fire-and-forget)
  const child = await getChildById(childId);
  if (child?.parent_phone) {
    await sendSms({
      childId,
      attendanceId: data.id,
      phoneNumber: child.parent_phone,
      message: `${child.name} has now left after-school club.`,
      messageType: 'check_out',
    });
  }

  return { success: true, data: data as Attendance };
}
