import { supabase } from '@/lib/supabase/server';
import type { SmsStatus } from '@/types';

/**
 * Returns the check-in SMS status for each attendance record.
 * Key: attendance_id → 'sent' | 'failed' | 'none'
 */
export async function getSmsStatusForAttendances(
  attendanceIds: string[]
): Promise<Map<string, SmsStatus | 'none'>> {
  if (!attendanceIds.length) return new Map();

  const { data } = await supabase
    .from('sms_messages')
    .select('attendance_id, status')
    .in('attendance_id', attendanceIds)
    .eq('message_type', 'check_in')
    .order('created_at', { ascending: false });

  const map = new Map<string, SmsStatus | 'none'>();
  for (const row of data ?? []) {
    // Take the latest status per attendance record
    if (!map.has(row.attendance_id)) {
      map.set(row.attendance_id, row.status as SmsStatus);
    }
  }
  return map;
}

/** Total SMS sent/failed today across all message types. */
export async function getSmsSummaryToday(): Promise<{ sent: number; failed: number }> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('sms_messages')
    .select('status')
    .gte('created_at', `${today}T00:00:00`);

  const rows = data ?? [];
  return {
    sent: rows.filter(r => r.status === 'sent').length,
    failed: rows.filter(r => r.status === 'failed').length,
  };
}
