-- Internal admin analytics aggregates (database only, no external APIs)
CREATE OR REPLACE FUNCTION public.get_admin_analytics(
    p_days integer DEFAULT 30,
    p_top_limit integer DEFAULT 10
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
    WITH params AS (
        SELECT
            GREATEST(7, LEAST(COALESCE(p_days, 30), 365)) AS days,
            GREATEST(1, LEAST(COALESCE(p_top_limit, 10), 50)) AS top_limit
    ),
    top_saved AS (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'card_id', ranked.card_id,
                    'question', ranked.question,
                    'slug', ranked.slug,
                    'save_count', ranked.save_count
                )
                ORDER BY ranked.save_count DESC, ranked.question ASC
            ),
            '[]'::jsonb
        ) AS items
        FROM (
            SELECT
                c.id AS card_id,
                c.question,
                c.slug,
                COUNT(f.id)::int AS save_count
            FROM favorites AS f
            INNER JOIN cards AS c ON c.id = f.content_id
            WHERE f.content_type = 'card'
            GROUP BY c.id, c.question, c.slug
            ORDER BY save_count DESC, c.question ASC
            LIMIT (SELECT top_limit FROM params)
        ) AS ranked
    ),
    top_liked AS (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'card_id', ranked.card_id,
                    'question', ranked.question,
                    'slug', ranked.slug,
                    'like_count', ranked.like_count
                )
                ORDER BY ranked.like_count DESC, ranked.question ASC
            ),
            '[]'::jsonb
        ) AS items
        FROM (
            SELECT
                c.id AS card_id,
                c.question,
                c.slug,
                COUNT(cl.id)::int AS like_count
            FROM card_likes AS cl
            INNER JOIN cards AS c ON c.id = cl.card_id
            GROUP BY c.id, c.question, c.slug
            ORDER BY like_count DESC, c.question ASC
            LIMIT (SELECT top_limit FROM params)
        ) AS ranked
    ),
    submission_window AS (
        SELECT COUNT(*)::int AS total_in_window
        FROM submissions AS s, params
        WHERE s.created_at >= (NOW() AT TIME ZONE 'UTC') - (params.days || ' days')::interval
    ),
    submission_buckets AS (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'date', grouped.bucket_date,
                    'count', grouped.cnt
                )
                ORDER BY grouped.bucket_date ASC
            ),
            '[]'::jsonb
        ) AS items
        FROM (
            SELECT
                (s.created_at AT TIME ZONE 'UTC')::date AS bucket_date,
                COUNT(*)::int AS cnt
            FROM submissions AS s, params
            WHERE s.created_at >= (NOW() AT TIME ZONE 'UTC') - (params.days || ' days')::interval
            GROUP BY bucket_date
        ) AS grouped
    ),
    newsletter_counts AS (
        SELECT jsonb_build_object(
            'active', COUNT(*) FILTER (WHERE enabled = true)::int,
            'total', COUNT(*)::int
        ) AS counts
        FROM newsletter_subscriptions
    ),
        push_counts AS (
        SELECT jsonb_build_object(
            'active', COUNT(*) FILTER (WHERE enabled = true)::int,
            'total', COUNT(*)::int
        ) AS counts
        FROM push_subscriptions
    )
    SELECT jsonb_build_object(
        'top_saved_cards', (SELECT items FROM top_saved),
        'top_liked_cards', (SELECT items FROM top_liked),
        'submission_volume', jsonb_build_object(
            'window_days', (SELECT days FROM params),
            'total_in_window', (SELECT total_in_window FROM submission_window),
            'buckets', (SELECT items FROM submission_buckets)
        ),
        'newsletter_subscribers', (SELECT counts FROM newsletter_counts),
        'push_subscribers', (SELECT counts FROM push_counts)
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_analytics(integer, integer) TO service_role;
