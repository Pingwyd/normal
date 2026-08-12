-- Full seed: one valid row per table in dependency order
-- Run after applying both migrations. Safe to re-run in a fresh database only.

BEGIN;

CREATE TEMP TABLE seed_ids (
    key text PRIMARY KEY,
    id uuid NOT NULL
);

WITH inserted_category AS (
    INSERT INTO categories (name, slug, phase, requires_clinical_review)
    VALUES ('Mind & Emotions', 'mind-emotions', 1, false)
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'category', id FROM inserted_category;

WITH inserted_tag AS (
    INSERT INTO tags (name)
    VALUES ('anxiety')
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'tag', id FROM inserted_tag;

WITH inserted_admin AS (
    INSERT INTO admin_users (auth_id, role, display_name)
    VALUES ('11111111-1111-1111-1111-111111111111', 'founder', 'Seed Founder')
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'admin', id FROM inserted_admin;

WITH inserted_card_primary AS (
    INSERT INTO cards (
        category_id,
        question,
        brief,
        slug,
        status,
        last_reviewed_by,
        requires_clinical_review
    )
    VALUES (
        (SELECT id FROM seed_ids WHERE key = 'category'),
        'Is it normal to feel anxious before a big event?',
        'Feeling nervous beforehand is very common.',
        'anxious-before-big-event',
        'published',
        (SELECT id FROM seed_ids WHERE key = 'admin'),
        false
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'card_primary', id FROM inserted_card_primary;

WITH inserted_card_related AS (
    INSERT INTO cards (
        category_id,
        question,
        brief,
        slug,
        status,
        requires_clinical_review
    )
    VALUES (
        (SELECT id FROM seed_ids WHERE key = 'category'),
        'Is it normal to feel butterflies in your stomach?',
        'A similar pre-event sensation many people report.',
        'butterflies-in-stomach',
        'published',
        false
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'card_related', id FROM inserted_card_related;

INSERT INTO card_tags (card_id, tag_id)
VALUES (
    (SELECT id FROM seed_ids WHERE key = 'card_primary'),
    (SELECT id FROM seed_ids WHERE key = 'tag')
);

WITH inserted_content_block AS (
    INSERT INTO content_blocks (card_id, position, type, data)
    VALUES (
        (SELECT id FROM seed_ids WHERE key = 'card_primary'),
        1,
        'paragraph',
        '{"text": "Many people feel this way before important moments."}'::jsonb
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'content_block', id FROM inserted_content_block;

WITH inserted_source AS (
    INSERT INTO sources (
        card_id,
        title,
        author_or_org,
        url,
        tier,
        published_date,
        accessed_date,
        metadata
    )
    VALUES (
        (SELECT id FROM seed_ids WHERE key = 'card_primary'),
        'Understanding Pre-Event Anxiety',
        'Example Health Org',
        'https://example.org/pre-event-anxiety',
        'expert_written',
        DATE '2024-01-15',
        CURRENT_DATE,
        '{"context": "seed data"}'::jsonb
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'source', id FROM inserted_source;

INSERT INTO card_related_overrides (card_id, related_card_id, position)
VALUES (
    (SELECT id FROM seed_ids WHERE key = 'card_primary'),
    (SELECT id FROM seed_ids WHERE key = 'card_related'),
    1
);

WITH inserted_account AS (
    INSERT INTO accounts (username, password_hash)
    VALUES ('seed_user', '$2b$12$seedhashseedhashseedhashseedhashseedhashseed')
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'account', id FROM inserted_account;

WITH inserted_recovery_code AS (
    INSERT INTO recovery_codes (account_id, code_hash)
    VALUES (
        (SELECT id FROM seed_ids WHERE key = 'account'),
        '$2b$12$recoveryhashrecoveryhashrecoveryhashrecoveryhash'
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'recovery_code', id FROM inserted_recovery_code;

WITH inserted_favorite AS (
    INSERT INTO favorites (account_id, content_type, content_id)
    VALUES (
        (SELECT id FROM seed_ids WHERE key = 'account'),
        'card',
        (SELECT id FROM seed_ids WHERE key = 'card_primary')
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'favorite', id FROM inserted_favorite;

WITH inserted_affirmation AS (
    INSERT INTO affirmations (text, status)
    VALUES ('I can handle uncertain moments with patience.', 'published')
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'affirmation', id FROM inserted_affirmation;

INSERT INTO affirmation_tags (affirmation_id, tag_id)
VALUES (
    (SELECT id FROM seed_ids WHERE key = 'affirmation'),
    (SELECT id FROM seed_ids WHERE key = 'tag')
);

WITH inserted_quote AS (
    INSERT INTO quotes (text, attributed_to, source_url, status)
    VALUES (
        'Courage is not the absence of fear, but the judgment that something else is more important.',
        'Ambrose Redmoon',
        'https://example.org/quote-source',
        'published'
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'quote', id FROM inserted_quote;

WITH inserted_card_like AS (
    INSERT INTO card_likes (card_id, account_id, device_identifier)
    VALUES (
        (SELECT id FROM seed_ids WHERE key = 'card_primary'),
        (SELECT id FROM seed_ids WHERE key = 'account'),
        NULL
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'card_like', id FROM inserted_card_like;

WITH inserted_submission AS (
    INSERT INTO submissions (
        question_text,
        status,
        likely_duplicate_of,
        handled_by,
        decision_notes
    )
    VALUES (
        'Is it normal to feel anxious before speaking in public?',
        'in_review',
        (SELECT id FROM seed_ids WHERE key = 'card_primary'),
        (SELECT id FROM seed_ids WHERE key = 'admin'),
        'Possible duplicate flagged during seed.'
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'submission', id FROM inserted_submission;

WITH inserted_reported_issue AS (
    INSERT INTO reported_issues (
        card_id,
        description,
        status,
        handled_by,
        resolution_notes
    )
    VALUES (
        (SELECT id FROM seed_ids WHERE key = 'card_primary'),
        'Seed reported issue for verification.',
        'open',
        (SELECT id FROM seed_ids WHERE key = 'admin'),
        NULL
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'reported_issue', id FROM inserted_reported_issue;

WITH inserted_review_log AS (
    INSERT INTO review_log (
        entity_type,
        entity_id,
        action,
        performed_by,
        performed_by_name_snapshot,
        notes
    )
    VALUES (
        'card',
        (SELECT id FROM seed_ids WHERE key = 'card_primary'),
        'published',
        (SELECT id FROM seed_ids WHERE key = 'admin'),
        'Seed Founder',
        'Seed review log entry.'
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'review_log', id FROM inserted_review_log;

WITH inserted_newsletter AS (
    INSERT INTO newsletter_subscriptions (email, enabled, unsubscribe_token)
    VALUES (
        'seed-newsletter@example.com',
        true,
        'seed-unsubscribe-token-0001'
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'newsletter', id FROM inserted_newsletter;

WITH inserted_push AS (
    INSERT INTO push_subscriptions (account_id, endpoint, keys, enabled)
    VALUES (
        (SELECT id FROM seed_ids WHERE key = 'account'),
        'https://push.example.com/subscription/seed-endpoint',
        '{"p256dh": "seed-key", "auth": "seed-auth"}'::jsonb,
        true
    )
    RETURNING id
)
INSERT INTO seed_ids (key, id)
SELECT 'push_subscription', id FROM inserted_push;

COMMIT;

SELECT key, id FROM seed_ids ORDER BY key;
