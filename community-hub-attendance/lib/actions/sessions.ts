'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase/server';
import { getOrCreateTodaySession } from '@/lib/queries/sessions';
import type { ActionResult, Session } from '@/types';

/** Creates today's session with defaults, then redirects to the session hub. */
export async function startTodaySession() {
  const session = await getOrCreateTodaySession();
  revalidatePath('/');
  redirect(`/sessions/${session.id}`);
}

/** Creates a session with custom parameters, then redirects to the session hub. */
export async function createSession(
  _prevState: ActionResult<Session> | null,
  formData: FormData
): Promise<ActionResult<Session>> {
  const clubName  = (formData.get('club_name')  as string)?.trim();
  const date      = formData.get('date')      as string;
  const startTime = formData.get('start_time') as string;
  const endTime   = formData.get('end_time')   as string;
  const capacity  = parseInt(formData.get('capacity') as string, 10);

  if (!clubName || !date || !startTime || !endTime || isNaN(capacity) || capacity < 1) {
    return { success: false, error: 'All fields are required and capacity must be at least 1.' };
  }

  if (endTime <= startTime) {
    return { success: false, error: 'End time must be after start time.' };
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({ club_name: clubName, date, start_time: startTime, end_time: endTime, capacity })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'A session with these details already exists for that date.' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  redirect(`/sessions/${data.id}`);
}
