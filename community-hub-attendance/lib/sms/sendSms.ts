import { supabase } from '@/lib/supabase/server';
import type { SmsMessageType } from '@/types';

interface SendSmsOptions {
  childId: string;
  attendanceId: string | null;
  phoneNumber: string;
  message: string;
  messageType: SmsMessageType;
}

interface SendSmsResult {
  sent: boolean;
  alreadySent: boolean;
}

/**
 * Sends an SMS via Twilio and records the result in `sms_messages`.
 *
 * If TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN are not set the function returns
 * immediately without touching the DB — safe for demo / pre-Twilio use.
 */
export async function sendSms({
  childId,
  attendanceId,
  phoneNumber,
  message,
  messageType,
}: SendSmsOptions): Promise<SendSmsResult> {
  // ── No-op when Twilio is not configured ───────────────────────────────────
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.log(`[SMS] Twilio not configured — skipping ${messageType} SMS to ${phoneNumber}`);
    return { sent: false, alreadySent: false };
  }

  // ── Duplicate prevention ──────────────────────────────────────────────────
  if (attendanceId) {
    const { data: existing } = await supabase
      .from('sms_messages')
      .select('id')
      .eq('attendance_id', attendanceId)
      .eq('message_type', messageType)
      .eq('status', 'sent')
      .maybeSingle();

    if (existing) {
      return { sent: false, alreadySent: true };
    }
  }

  // ── Send via Twilio ───────────────────────────────────────────────────────
  // Import dynamically so the module can be loaded even without twilio installed
  let twilioSid: string | null = null;
  let status: 'sent' | 'failed' = 'sent';
  let errorMessage: string | null = null;

  try {
    const twilio = (await import('twilio')).default;
    const msg = await twilio(sid, token).messages.create({ to: phoneNumber, from, body: message });
    twilioSid = msg.sid;
  } catch (err: any) {
    status = 'failed';
    errorMessage = err.message ?? 'Unknown Twilio error';
    console.error(`[SMS] Failed to send ${messageType} to ${phoneNumber}:`, err.message);
  }

  // ── Log result to DB ──────────────────────────────────────────────────────
  await supabase.from('sms_messages').insert({
    child_id:      childId,
    attendance_id: attendanceId,
    phone_number:  phoneNumber,
    message,
    message_type:  messageType,
    status,
    twilio_sid:    twilioSid,
    error_message: errorMessage,
  });

  return { sent: status === 'sent', alreadySent: false };
}
