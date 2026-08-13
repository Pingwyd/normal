-- Analytics verification seed: known counts for manual vs RPC checks.
-- Run after migration 20260813150000_get_admin_analytics.sql.
-- Safe to re-run: uses fixed slugs and deletes prior analytics-verify rows first.

BEGIN;

DELETE FROM favorites
WHERE content_id IN (
    SELECT id FROM cards
    WHERE slug IN ('analytics-verify-card-a', 'analytics-verify-card-b')
);

DELETE FROM card_likes
WHERE card_id IN (
    SELECT id FROM cards
    WHERE slug IN ('analytics-verify-card-a', 'analytics-verify-card-b')
);

DELETE FROM submissions
WHERE question_text LIKE 'Analytics verify submission %';

DELETE FROM newsletter_subscriptions
WHERE email LIKE 'analytics-verify-%@example.com';

DELETE FROM push_subscriptions
WHERE endpoint LIKE 'https://push.example.com/analytics-verify/%';

DELETE FROM cards
WHERE slug IN ('analytics-verify-card-a', 'analytics-verify-card-b');

INSERT INTO categories (name, slug, phase, requires_clinical_review)
VALUES ('Analytics Verify', 'analytics-verify', 1, false)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO cards (
    category_id,
    question,
    brief,
    slug,
    status,
    requires_clinical_review,
    published_at
)
VALUES
    (
        (SELECT id FROM categories WHERE slug = 'analytics-verify'),
        'Analytics verify card A',
        'Seed card A for analytics verification.',
        'analytics-verify-card-a',
        'published',
        false,
        NOW()
    ),
    (
        (SELECT id FROM categories WHERE slug = 'analytics-verify'),
        'Analytics verify card B',
        'Seed card B for analytics verification.',
        'analytics-verify-card-b',
        'published',
        false,
        NOW()
    );

INSERT INTO favorites (account_id, content_type, content_id)
SELECT NULL, 'card', c.id
FROM cards AS c
CROSS JOIN generate_series(1, CASE c.slug
    WHEN 'analytics-verify-card-a' THEN 5
    WHEN 'analytics-verify-card-b' THEN 2
    ELSE 0
END)
WHERE c.slug IN ('analytics-verify-card-a', 'analytics-verify-card-b');

INSERT INTO card_likes (card_id, account_id, device_identifier)
SELECT c.id, NULL, 'analytics-verify-device-' || c.slug || '-' || gs.i
FROM cards AS c
CROSS JOIN generate_series(1, CASE c.slug
    WHEN 'analytics-verify-card-a' THEN 1
    WHEN 'analytics-verify-card-b' THEN 4
    ELSE 0
END) AS gs(i)
WHERE c.slug IN ('analytics-verify-card-a', 'analytics-verify-card-b');

INSERT INTO submissions (question_text, status, created_at)
VALUES
    (
        'Analytics verify submission one',
        'submitted',
        (NOW() AT TIME ZONE 'UTC') - INTERVAL '2 days'
    ),
    (
        'Analytics verify submission two',
        'submitted',
        (NOW() AT TIME ZONE 'UTC') - INTERVAL '2 days'
    ),
    (
        'Analytics verify submission three',
        'submitted',
        (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day'
    );

INSERT INTO newsletter_subscriptions (email, enabled, unsubscribe_token)
VALUES
    ('analytics-verify-active@example.com', true, 'analytics-verify-token-1'),
    ('analytics-verify-inactive@example.com', false, 'analytics-verify-token-2');

INSERT INTO push_subscriptions (account_id, endpoint, keys, enabled)
VALUES
    (
        NULL,
        'https://push.example.com/analytics-verify/active',
        '{"p256dh": "verify-key-1", "auth": "verify-auth-1"}'::jsonb,
        true
    ),
    (
        NULL,
        'https://push.example.com/analytics-verify/inactive',
        '{"p256dh": "verify-key-2", "auth": "verify-auth-2"}'::jsonb,
        false
    );

COMMIT;

-- Expected aggregates (within 30-day window, top_limit 10):
-- top_saved_cards: card-a save_count=5, card-b save_count=2
-- top_liked_cards: card-b like_count=4, card-a like_count=1
-- submission_volume.total_in_window: includes at least 3 verify submissions
-- newsletter_subscribers: active=1 (+ any pre-existing), total includes verify rows
-- push_subscribers: active=1 (+ any pre-existing), total includes verify rows
