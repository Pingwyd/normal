-- Secure RLS for all public tables exposed to PostgREST.
-- Architecture: FastAPI uses service_role (bypasses RLS). The anon/authenticated
-- roles must not read or write application data directly via the Data API.
-- Admin Supabase Auth users retain scoped access to admin_users and review_log only.

-- 1. Enable and force RLS on backend-only tables (deny-by-default: no policies).
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories FORCE ROW LEVEL SECURITY;

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags FORCE ROW LEVEL SECURITY;

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards FORCE ROW LEVEL SECURITY;

ALTER TABLE card_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tags FORCE ROW LEVEL SECURITY;

ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks FORCE ROW LEVEL SECURITY;

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources FORCE ROW LEVEL SECURITY;

ALTER TABLE card_related_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_related_overrides FORCE ROW LEVEL SECURITY;

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE recovery_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_codes FORCE ROW LEVEL SECURITY;

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites FORCE ROW LEVEL SECURITY;

ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE affirmations FORCE ROW LEVEL SECURITY;

ALTER TABLE affirmation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE affirmation_tags FORCE ROW LEVEL SECURITY;

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes FORCE ROW LEVEL SECURITY;

ALTER TABLE card_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_likes FORCE ROW LEVEL SECURITY;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions FORCE ROW LEVEL SECURITY;

ALTER TABLE reported_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_issues FORCE ROW LEVEL SECURITY;

-- admin_users and review_log already have RLS + policies from the prior migration.

-- 2. Remove direct table access for anon (publishable key must not reach app data).
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- 3. Limit authenticated to admin tables guarded by existing RLS policies.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT, INSERT ON review_log TO authenticated;

-- 4. Helper functions are for RLS policy evaluation, not public RPC.
REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_admin_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_admin_user_id() TO authenticated;

-- 5. Backend-only RPC helpers: service_role only.
REVOKE EXECUTE ON FUNCTION public.get_admin_analytics(integer, integer)
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.find_likely_duplicate_card(text)
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_admin_analytics(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.find_likely_duplicate_card(text) TO service_role;

-- 6. Harden function search paths (Supabase security advisor).
ALTER FUNCTION public.find_likely_duplicate_card(text) SET search_path = public;
ALTER FUNCTION public.get_admin_analytics(integer, integer) SET search_path = public;

-- 7. Supabase internal helper should not be callable via the Data API.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc AS p
        INNER JOIN pg_namespace AS n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'rls_auto_enable'
    ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
    END IF;
END
$$;
