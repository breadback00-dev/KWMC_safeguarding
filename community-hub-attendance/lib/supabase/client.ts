import { createClient } from "@supabase/supabase-js";

// Service role key for server-side operations (bypasses RLS)
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
