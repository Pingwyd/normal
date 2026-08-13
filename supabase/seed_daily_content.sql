-- Seed published affirmations and quotes for local/dev deck testing.
-- Idempotent: skips rows whose text already exists.
-- Run after migrations (and optionally after seed_full.sql).

BEGIN;

INSERT INTO tags (name)
VALUES
    ('anxiety'),
    ('calm'),
    ('self-compassion'),
    ('confidence'),
    ('rest')
ON CONFLICT (name) DO NOTHING;

WITH affirmation_rows (text, tag_names) AS (
    VALUES
        (
            'I can notice anxious thoughts without letting them run the whole day.',
            ARRAY['anxiety', 'calm']
        ),
        (
            'Feeling nervous before something important does not mean I am failing.',
            ARRAY['anxiety', 'confidence']
        ),
        (
            'I am allowed to rest without earning it first.',
            ARRAY['rest', 'self-compassion']
        ),
        (
            'Uncertainty is uncomfortable, and I can still take one small step.',
            ARRAY['anxiety', 'confidence']
        ),
        (
            'My worth is not measured by how productive I am today.',
            ARRAY['self-compassion', 'rest']
        ),
        (
            'I can be kind to myself and still hold myself accountable.',
            ARRAY['self-compassion', 'confidence']
        ),
        (
            'It is okay to ask for help when something feels heavier than usual.',
            ARRAY['anxiety', 'self-compassion']
        ),
        (
            'I do not need to compare my inner life to someone else''s highlight reel.',
            ARRAY['anxiety', 'calm']
        ),
        (
            'A hard moment can be real without defining my whole story.',
            ARRAY['self-compassion', 'calm']
        ),
        (
            'I can set a boundary even if someone else does not understand it.',
            ARRAY['confidence', 'self-compassion']
        ),
        (
            'Progress can be quiet and still count.',
            ARRAY['confidence', 'calm']
        ),
        (
            'I am learning what works for me, and that takes time.',
            ARRAY['self-compassion', 'confidence']
        ),
        (
            'I can feel disappointed and still trust that I will adapt.',
            ARRAY['calm', 'confidence']
        ),
        (
            'My emotions can be information, not instructions I must obey.',
            ARRAY['calm', 'self-compassion']
        ),
        (
            'I do not have to resolve everything tonight.',
            ARRAY['rest', 'calm']
        ),
        (
            'Being sensitive is not the same as being weak.',
            ARRAY['self-compassion', 'confidence']
        ),
        (
            'I can celebrate small wins without waiting for the perfect outcome.',
            ARRAY['confidence', 'calm']
        ),
        (
            'It is normal to need space after a draining day.',
            ARRAY['rest', 'anxiety']
        ),
        (
            'I can change my mind when I learn something new.',
            ARRAY['confidence', 'self-compassion']
        ),
        (
            'Showing up honestly is enough for today.',
            ARRAY['calm', 'self-compassion']
        )
),
inserted_affirmations AS (
    INSERT INTO affirmations (text, status, created_at, updated_at)
    SELECT
        affirmation_rows.text,
        'published'::daily_content_status,
        NOW() - ((ROW_NUMBER() OVER (ORDER BY affirmation_rows.text)) || ' hours')::interval,
        NOW() - ((ROW_NUMBER() OVER (ORDER BY affirmation_rows.text)) || ' hours')::interval
    FROM affirmation_rows
    WHERE NOT EXISTS (
        SELECT 1
        FROM affirmations existing
        WHERE existing.text = affirmation_rows.text
    )
    RETURNING id, text
)
INSERT INTO affirmation_tags (affirmation_id, tag_id)
SELECT inserted_affirmations.id, tags.id
FROM inserted_affirmations
JOIN affirmation_rows ON affirmation_rows.text = inserted_affirmations.text
CROSS JOIN LATERAL UNNEST(affirmation_rows.tag_names) AS tag_name (name)
JOIN tags ON tags.name = tag_name.name;

WITH quote_rows (text, attributed_to, source_url) AS (
    VALUES
        (
            'Courage is not the absence of fear, but the judgment that something else is more important.',
            'Ambrose Redmoon',
            'https://www.goodreads.com/quotes/684-courage-is-not-the-absence-of-fear'
        ),
        (
            'You do not have to control your thoughts. You just have to stop letting them control you.',
            'Dan Millman',
            'https://www.goodreads.com/quotes/102928-you-don-t-have-to-control-your-thoughts'
        ),
        (
            'Feelings are much like waves. We cannot stop them from coming, but we can choose which ones to surf.',
            'Jonatan Martensson',
            'https://www.goodreads.com/quotes/56427-feelings-are-much-like-waves'
        ),
        (
            'Talk to yourself like you would to someone you love.',
            'Brené Brown',
            'https://brenebrown.com/resources/'
        ),
        (
            'The only way out is through.',
            'Robert Frost',
            'https://www.poetryfoundation.org/poets/robert-frost'
        ),
        (
            'Rest when you are weary. Refresh and renew yourself, your body, your mind, your spirit.',
            'Lailah Gifty Akita',
            'https://www.goodreads.com/author/quotes/7792250.Lailah_Gifty_Akita'
        ),
        (
            'What lies behind us and what lies before us are tiny matters compared to what lies within us.',
            'Ralph Waldo Emerson',
            'https://www.poetryfoundation.org/poets/ralph-waldo-emerson'
        ),
        (
            'You are not a drop in the ocean. You are the entire ocean in a drop.',
            'Rumi',
            'https://www.poetryfoundation.org/poets/rumi'
        ),
        (
            'Nothing can bring you peace but yourself.',
            'Ralph Waldo Emerson',
            'https://www.poetryfoundation.org/poets/ralph-waldo-emerson'
        ),
        (
            'The present moment is filled with joy and happiness. If you are attentive, you will see it.',
            'Thich Nhat Hanh',
            'https://plumvillage.org/about/thich-nhat-hanh/'
        ),
        (
            'Almost everything will work again if you unplug it for a few minutes, including you.',
            'Anne Lamott',
            'https://www.anne-lamott.com/'
        ),
        (
            'It is not the load that breaks you down. It is the way you carry it.',
            'Lou Holtz',
            'https://www.goodreads.com/quotes/16790-it-s-not-the-load-that-breaks-you-down'
        ),
        (
            'You must learn a new way to think before you can master a new way to be.',
            'Marianne Williamson',
            'https://marianne.com/'
        ),
        (
            'Do not let the behavior of others destroy your inner peace.',
            'Dalai Lama',
            'https://www.dalailama.com/'
        ),
        (
            'The wound is the place where the light enters you.',
            'Rumi',
            'https://www.poetryfoundation.org/poets/rumi'
        ),
        (
            'Self-compassion is simply giving the same kindness to ourselves that we would give to others.',
            'Christopher Germer',
            'https://chrisgermer.com/'
        ),
        (
            'You are braver than you believe, stronger than you seem, and smarter than you think.',
            'A.A. Milne',
            'https://www.goodreads.com/quotes/58964-you-are-braver-than-you-believe'
        ),
        (
            'The most wasted of all days is one without laughter.',
            'Nicolas Chamfort',
            'https://www.goodreads.com/quotes/467-the-most-wasted-of-all-days'
        ),
        (
            'Life is not what it is supposed to be. It is what it is. The way you cope with it is what makes the difference.',
            'Virginia Satir',
            'https://www.virginiasatir.org/'
        ),
        (
            'You do not have to be perfect to be worthy of care.',
            'Unknown',
            'https://example.org/normal/quote-source'
        )
)
INSERT INTO quotes (text, attributed_to, source_url, status, created_at, updated_at)
SELECT
    quote_rows.text,
    quote_rows.attributed_to,
    quote_rows.source_url,
    'published'::daily_content_status,
    NOW() - ((ROW_NUMBER() OVER (ORDER BY quote_rows.text)) || ' hours')::interval,
    NOW() - ((ROW_NUMBER() OVER (ORDER BY quote_rows.text)) || ' hours')::interval
FROM quote_rows
WHERE NOT EXISTS (
    SELECT 1
    FROM quotes existing
    WHERE existing.text = quote_rows.text
);

COMMIT;

SELECT 'affirmations' AS table_name, COUNT(*) AS row_count FROM affirmations
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'affirmation_tags', COUNT(*) FROM affirmation_tags;
