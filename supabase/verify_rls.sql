-- RLS verification script
-- Run after applying 20260813160000_secure_public_rls.sql
-- Requires seed_auth_verify.sql (or equivalent admin_users row) for admin checks.

-- anon must not read application tables (RLS enabled, no policies => zero rows)
SET ROLE anon;

SELECT
    'anon_cards_count' AS check_name,
    COUNT(*)::text AS detail
FROM cards;

SELECT
    'anon_accounts_count' AS check_name,
    COUNT(*)::text AS detail
FROM accounts;

RESET ROLE;

-- non-admin authenticated identity must not read review_log or cards
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', false);

SELECT
    'non_admin_review_log_count' AS check_name,
    COUNT(*)::text AS detail
FROM review_log;

SELECT
    'non_admin_cards_count' AS check_name,
    COUNT(*)::text AS detail
FROM cards;

RESET ROLE;

-- admin authenticated identity should read review_log and admin_users
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

SELECT
    'admin_review_log_count' AS check_name,
    COUNT(*)::text AS detail
FROM review_log;

SELECT
    'admin_users_count' AS check_name,
    COUNT(*)::text AS detail
FROM admin_users;

RESET ROLE;
