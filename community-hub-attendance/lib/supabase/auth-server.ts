/**
 * Server-side Supabase client that uses cookies for Auth session management.
 * Use this (not server.ts) when you need to read the logged-in user.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies can't be set here.
            // Middleware refreshes the session before it expires.
          }
        },
      },
    }
  );
}

/** Returns the authenticated user or null. */
export async function getAuthUser() {
  const client = await createAuthClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}
