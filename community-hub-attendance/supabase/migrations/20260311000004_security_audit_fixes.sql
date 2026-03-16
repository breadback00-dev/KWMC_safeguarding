-- Fix security issues from Supabase Audit (tables from Childcare project)
-- Enabling RLS prevents unauthorized public access.
ALTER TABLE IF EXISTS public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.safeguarding_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.safeguarding_incidents ENABLE ROW LEVEL SECURITY;
