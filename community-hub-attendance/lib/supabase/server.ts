/**
 * Server-only Supabase client using the service role key.
 * This bypasses Row Level Security — NEVER import this in client components.
 * Only use in: API routes, server components, server actions.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing Supabase env vars. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
  );
}

export const supabase = createClient(url, key);
