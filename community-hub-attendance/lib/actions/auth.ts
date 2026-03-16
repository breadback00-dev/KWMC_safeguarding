'use server';

import { redirect } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase/auth-server';

export async function signIn(formData: FormData) {
  const email    = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect('/login?error=Email+and+password+are+required');
  }

  const client = await createAuthClient();
  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    redirect('/login?error=Invalid+email+or+password');
  }

  redirect('/');
}

export async function signOut() {
  const client = await createAuthClient();
  await client.auth.signOut();
  redirect('/login');
}

export async function signUp(formData: FormData) {
  const email    = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    redirect('/signup?error=Email+and+password+are+required');
  }

  const client = await createAuthClient();
  const { error } = await client.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Auto sign-in after registration
  await client.auth.signInWithPassword({ email, password });
  redirect('/');
}
