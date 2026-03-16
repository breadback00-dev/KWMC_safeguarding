/**
 * Server-only Supabase client using the service role key.
 * This bypasses Row Level Security — NEVER import this in client components.
 * Only use in: API routes, server components, server actions.
 */
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
