-- RLS verification for review_log
-- Requires seed_full.sql to have run first.

-- Non-admin identity should see zero rows in review_log
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);

SELECT
    'non_admin_review_log_count' AS check_name,
    COUNT(*)::text AS detail
FROM review_log;

RESET ROLE;

-- Admin identity should see seeded rows
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);

SELECT
    'admin_review_log_count' AS check_name,
    COUNT(*)::text AS detail
FROM review_log;

RESET ROLE;
