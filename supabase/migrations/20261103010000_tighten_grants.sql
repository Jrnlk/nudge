-- Remove default privileges the app never uses.
-- rls_auto_enable is Supabase's event-trigger helper; it only needs to fire on DDL, never via the API.
-- (EXECUTE is granted to PUBLIC by default, so revoke it there too. Event triggers still fire.)
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Supabase grants these by default. The API can't use them, and TRUNCATE would bypass RLS.
revoke truncate, references, trigger on public.profiles, public.applications from authenticated;
