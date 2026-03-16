'use server';

import { revalidatePath } from 'next/cache';
import { performCheckIn } from '@/lib/services/attendance';
import { supabase } from '@/lib/supabase/server';
import type { ActionResult, Attendance } from '@/types';

export async function checkInChild(childId: string): Promise<ActionResult<Attendance>> {
  const result = await performCheckIn(childId, 'staff');

  if (result.success) {
    revalidatePath('/');
    revalidatePath(`/sessions/${result.data.session_id}`);
    revalidatePath('/safeguarding');
  }

  return result;
}

const UNDO_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/** Deletes an attendance record if it was created within the last 5 minutes. */
export async function undoCheckIn(attendanceId: string): Promise<ActionResult<void>> {
  const { data: record, error: fetchError } = await supabase
    .from('attendance')
    .select('id, checked_in_at, session_id')
    .eq('id', attendanceId)
    .single();

  if (fetchError || !record) {
    return { success: false, error: 'Check-in record not found.' };
  }

  const age = Date.now() - new Date(record.checked_in_at).getTime();
  if (age > UNDO_WINDOW_MS) {
    return { success: false, error: 'Undo window has expired (5 minutes).' };
  }

  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', attendanceId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  revalidatePath(`/sessions/${record.session_id}`);
  return { success: true, data: undefined };
}
