import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { getOrCreateTodaySession } from '@/lib/queries/sessions';
import { getActiveChildren } from '@/lib/queries/children';
import { sendSms } from '@/lib/sms/sendSms';

/**
 * POST /api/sessions/mark-absent
 *
 * Marks all registered children not yet checked in as 'absent' and sends
 * a parent alert SMS for each. Safe to call multiple times — both the
 * attendance upsert and the SMS deduplication key prevent double entries.
 */
export async function POST() {
  // 1. Resolve today's session
  let session;
  try {
    session = await getOrCreateTodaySession();
  } catch {
    return NextResponse.json({ error: 'No session available for today.' }, { status: 400 });
  }

  // 2. Get all registered active children
  const allChildren = await getActiveChildren();

  // 3. Find children who have ANY attendance record this session (present or already absent)
  const { data: existingAttendance } = await supabase
    .from('attendance')
    .select('child_id')
    .eq('session_id', session.id);

  const alreadyRecordedIds = new Set(
    (existingAttendance ?? []).map((r: { child_id: string }) => r.child_id)
  );

  // 4. Process absent children
  const absentChildren = allChildren.filter(c => !alreadyRecordedIds.has(c.id));

  let markedCount = 0;
  let smsSentCount = 0;
  const errors: string[] = [];

  for (const child of absentChildren) {
    // Insert absent attendance record (upsert protects against concurrent calls)
    const { data: att, error: attError } = await supabase
      .from('attendance')
      .upsert(
        { child_id: child.id, session_id: session.id, status: 'absent' },
        { onConflict: 'child_id,session_id' }
      )
      .select('id')
      .single();

    if (attError) {
      errors.push(`Failed to mark ${child.name} absent: ${attError.message}`);
      continue;
    }

    markedCount++;

    // Send absence alert SMS
    if (child.parent_phone) {
      const result = await sendSms({
        childId: child.id,
        attendanceId: att?.id ?? null,
        phoneNumber: child.parent_phone,
        message: `${child.name} was expected at after-school club today but has not arrived. Please contact staff if this is unexpected.`,
        messageType: 'absence_alert',
      });
      if (result.sent) smsSentCount++;
    }
  }

  return NextResponse.json({
    status: 'done',
    sessionId: session.id,
    markedAbsent: markedCount,
    smsSent: smsSentCount,
    ...(errors.length > 0 && { errors }),
  });
}
