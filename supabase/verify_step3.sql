-- Step 3 verification script
-- Run after migrations and seed_full.sql

-- 1) Schema audit: expected public tables only
WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'accounts',
        'admin_users',
        'affirmation_tags',
        'affirmations',
        'card_likes',
        'card_related_overrides',
        'card_tags',
        'cards',
        'categories',
        'content_blocks',
        'favorites',
        'newsletter_subscriptions',
        'push_subscriptions',
        'quotes',
        'recovery_codes',
        'reported_issues',
        'review_log',
        'sources',
        'submissions',
        'tags'
    ]::text[]) AS table_name
),
actual_tables AS (
    SELECT tablename AS table_name
    FROM pg_tables
    WHERE schemaname = 'public'
)
SELECT
    'missing_tables' AS check_name,
    COALESCE(string_agg(expected_tables.table_name, ', ' ORDER BY expected_tables.table_name), '') AS detail
FROM expected_tables
LEFT JOIN actual_tables USING (table_name)
WHERE actual_tables.table_name IS NULL

UNION ALL

SELECT
    'extra_tables' AS check_name,
    COALESCE(string_agg(actual_tables.table_name, ', ' ORDER BY actual_tables.table_name), '') AS detail
FROM actual_tables
LEFT JOIN expected_tables USING (table_name)
WHERE expected_tables.table_name IS NULL;

-- 2) Trigram index existence
SELECT
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
      'idx_cards_question_trgm',
      'idx_submissions_question_text_trgm'
  )
ORDER BY indexname;

-- 3) Trigram fuzzy match against cards.question
SELECT
    question,
    similarity(question, 'Is it normal to feel anxious before speaking?') AS score
FROM cards
WHERE question OPERATOR(public.%) 'Is it normal to feel anxious before speaking?'
ORDER BY score DESC
LIMIT 5;

-- 4) Row counts after seed (expect >= 1 for each table)
SELECT 'accounts' AS table_name, COUNT(*) AS row_count FROM accounts
UNION ALL SELECT 'admin_users', COUNT(*) FROM admin_users
UNION ALL SELECT 'affirmation_tags', COUNT(*) FROM affirmation_tags
UNION ALL SELECT 'affirmations', COUNT(*) FROM affirmations
UNION ALL SELECT 'card_likes', COUNT(*) FROM card_likes
UNION ALL SELECT 'card_related_overrides', COUNT(*) FROM card_related_overrides
UNION ALL SELECT 'card_tags', COUNT(*) FROM card_tags
UNION ALL SELECT 'cards', COUNT(*) FROM cards
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'content_blocks', COUNT(*) FROM content_blocks
UNION ALL SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL SELECT 'newsletter_subscriptions', COUNT(*) FROM newsletter_subscriptions
UNION ALL SELECT 'push_subscriptions', COUNT(*) FROM push_subscriptions
UNION ALL SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL SELECT 'recovery_codes', COUNT(*) FROM recovery_codes
UNION ALL SELECT 'reported_issues', COUNT(*) FROM reported_issues
UNION ALL SELECT 'review_log', COUNT(*) FROM review_log
UNION ALL SELECT 'sources', COUNT(*) FROM sources
UNION ALL SELECT 'submissions', COUNT(*) FROM submissions
UNION ALL SELECT 'tags', COUNT(*) FROM tags
ORDER BY table_name;
