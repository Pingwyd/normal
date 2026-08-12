-- Manual verification for Step 1 acceptance (run after applying migration 20260812120000)
-- Inserts one category, one card, one tag, and one card_tags link.

BEGIN;

INSERT INTO categories (name, slug, phase, requires_clinical_review)
VALUES ('Mind & Emotions', 'mind-emotions', 1, false);

INSERT INTO tags (name)
VALUES ('anxiety');

INSERT INTO cards (
    category_id,
    question,
    brief,
    slug,
    status,
    requires_clinical_review
)
VALUES (
    (SELECT id FROM categories WHERE slug = 'mind-emotions'),
    'Is it normal to feel anxious before a big event?',
    'Feeling nervous beforehand is very common.',
    'anxious-before-big-event',
    'draft',
    false
);

INSERT INTO card_tags (card_id, tag_id)
VALUES (
    (SELECT id FROM cards WHERE slug = 'anxious-before-big-event'),
    (SELECT id FROM tags WHERE name = 'anxiety')
);

COMMIT;
