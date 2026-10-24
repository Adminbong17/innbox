-- ==============================================================================
-- innbox E-Commerce
-- Supabase Keep-Alive & Anti-Pause Schema Setup
--
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/zmxrghnklvvkvrizztvx
-- 2. Navigate to "SQL Editor" on the left sidebar.
-- 3. Click "New Query", paste the SQL below, and click "RUN".
-- ==============================================================================

-- 1. Create keep_alive_logs table
CREATE TABLE IF NOT EXISTS public.keep_alive_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pinged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    source TEXT NOT NULL DEFAULT 'cron_keep_alive',
    status TEXT NOT NULL DEFAULT 'active',
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.keep_alive_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Allow keep_alive_logs insert" ON public.keep_alive_logs;
CREATE POLICY "Allow keep_alive_logs insert"
ON public.keep_alive_logs
FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow keep_alive_logs select" ON public.keep_alive_logs;
CREATE POLICY "Allow keep_alive_logs select"
ON public.keep_alive_logs
FOR SELECT
TO anon, authenticated, service_role
USING (true);

DROP POLICY IF EXISTS "Allow keep_alive_logs delete" ON public.keep_alive_logs;
CREATE POLICY "Allow keep_alive_logs delete"
ON public.keep_alive_logs
FOR DELETE
TO anon, authenticated, service_role
USING (true);

-- 4. Grant table permissions
GRANT ALL ON public.keep_alive_logs TO anon, authenticated, service_role;

-- 5. Auto-Cleanup Trigger (Keeps table lightweight by deleting logs older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_keep_alive_logs()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.keep_alive_logs
    WHERE pinged_at < NOW() - INTERVAL '30 days';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_cleanup_old_keep_alive_logs ON public.keep_alive_logs;
CREATE TRIGGER tr_cleanup_old_keep_alive_logs
AFTER INSERT ON public.keep_alive_logs
EXECUTE FUNCTION public.cleanup_old_keep_alive_logs();

-- 6. Initial test ping insertion
INSERT INTO public.keep_alive_logs (source, status, meta)
VALUES ('initial_setup', 'active', '{"initiated_by": "innbox_keep_alive_setup"}'::jsonb);

-- Verification:
SELECT id, pinged_at, source, status, created_at FROM public.keep_alive_logs ORDER BY pinged_at DESC LIMIT 5;
