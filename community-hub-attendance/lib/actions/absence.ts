'use server';

import { revalidatePath } from 'next/cache';
import { sendSms } from '@/lib/sms/sendSms';
import { supabase } from '@/lib/supabase/server';
import { getNotArrivedChildren } from '@/lib/queries/children';
import type { ActionResult } from '@/types';

interface AbsenceAlertResult {
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * Sends SMS absence alerts to parents of children who have not yet arrived
 * for the given session. Skips children who already received an alert today.
 */
export async function sendAbsenceAlerts(
  sessionId: string
): Promise<ActionResult<AbsenceAlertResult>> {
  const notArrived = await getNotArrivedChildren(sessionId);

  if (notArrived.length === 0) {
    return { success: true, data: { sent: 0, skipped: 0, failed: 0 } };
  }

  // Avoid re-sending alerts that went out earlier today
  const today = new Date().toISOString().split('T')[0];
  const { data: existingAlerts } = await supabase
    .from('sms_messages')
    .select('child_id')
    .eq('message_type', 'absence_alert')
    .eq('status', 'sent')
    .in('child_id', notArrived.map(c => c.id))
    .gte('created_at', `${today}T00:00:00`);

  const alreadyAlerted = new Set(
    (existingAlerts ?? []).map((r: { child_id: string }) => r.child_id)
  );

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const child of notArrived) {
    if (!child.parent_phone || alreadyAlerted.has(child.id)) {
      skipped++;
      continue;
    }

    const parentName = child.parent_name ?? 'Parent';
    const message =
      `Hi ${parentName}, this is a message from the Community Hub. ` +
      `${child.name} has not yet arrived for today's session. ` +
      `Please contact us if they will not be attending.`;

    const result = await sendSms({
      childId: child.id,
      attendanceId: null,
      phoneNumber: child.parent_phone,
      message,
      messageType: 'absence_alert',
    });

    if (result.sent) {
      sent++;
    } else {
      failed++;
    }
  }

  revalidatePath('/');
  revalidatePath(`/sessions/${sessionId}`);
  return { success: true, data: { sent, skipped, failed } };
}
