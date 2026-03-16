'use server';

import { revalidatePath } from 'next/cache';
import { performCheckOut } from '@/lib/services/attendance';
import type { ActionResult, Attendance } from '@/types';

export async function checkOutChild(childId: string): Promise<ActionResult<Attendance>> {
  const result = await performCheckOut(childId, 'staff');

  if (result.success) {
    revalidatePath('/');
    revalidatePath(`/sessions/${result.data.session_id}`);
    revalidatePath('/safeguarding');
  }

  return result;
}
