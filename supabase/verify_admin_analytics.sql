-- Step 11 verification: get_admin_analytics RPC vs manual table counts.
-- Run after migrations and seed_analytics_verify.sql.

DO $$
DECLARE
    card_a_id uuid;
    card_b_id uuid;
    rpc jsonb;
    manual_saved_a int;
    manual_saved_b int;
    manual_liked_a int;
    manual_liked_b int;
    manual_submissions int;
    manual_newsletter_active int;
    manual_newsletter_total int;
    manual_push_active int;
    manual_push_total int;
    rpc_saved_a int;
    rpc_saved_b int;
    rpc_liked_a int;
    rpc_liked_b int;
BEGIN
    SELECT id INTO card_a_id FROM cards WHERE slug = 'analytics-verify-card-a';
    SELECT id INTO card_b_id FROM cards WHERE slug = 'analytics-verify-card-b';

    IF card_a_id IS NULL OR card_b_id IS NULL THEN
        RAISE EXCEPTION 'Run seed_analytics_verify.sql first (verify cards missing).';
    END IF;

    SELECT COUNT(*)::int INTO manual_saved_a
    FROM favorites AS f
    INNER JOIN cards AS c ON c.id = f.content_id
    WHERE f.content_type = 'card' AND c.id = card_a_id;

    SELECT COUNT(*)::int INTO manual_saved_b
    FROM favorites AS f
    INNER JOIN cards AS c ON c.id = f.content_id
    WHERE f.content_type = 'card' AND c.id = card_b_id;

    SELECT COUNT(*)::int INTO manual_liked_a
    FROM card_likes WHERE card_id = card_a_id;

    SELECT COUNT(*)::int INTO manual_liked_b
    FROM card_likes WHERE card_id = card_b_id;

    SELECT COUNT(*)::int INTO manual_submissions
    FROM submissions AS s
    WHERE s.created_at >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '30 days'
      AND s.question_text LIKE 'Analytics verify submission %';

    SELECT
        COUNT(*) FILTER (WHERE enabled = true)::int,
        COUNT(*)::int
    INTO manual_newsletter_active, manual_newsletter_total
    FROM newsletter_subscriptions
    WHERE email LIKE 'analytics-verify-%@example.com';

    SELECT
        COUNT(*) FILTER (WHERE enabled = true)::int,
        COUNT(*)::int
    INTO manual_push_active, manual_push_total
    FROM push_subscriptions
    WHERE endpoint LIKE 'https://push.example.com/analytics-verify/%';

    IF manual_saved_a <> 5 OR manual_saved_b <> 2 THEN
        RAISE EXCEPTION 'Manual save counts mismatch: a=% b=%', manual_saved_a, manual_saved_b;
    END IF;

    IF manual_liked_a <> 1 OR manual_liked_b <> 4 THEN
        RAISE EXCEPTION 'Manual like counts mismatch: a=% b=%', manual_liked_a, manual_liked_b;
    END IF;

    IF manual_submissions <> 3 THEN
        RAISE EXCEPTION 'Manual submission count mismatch: %', manual_submissions;
    END IF;

    IF manual_newsletter_active <> 1 OR manual_newsletter_total <> 2 THEN
        RAISE EXCEPTION 'Manual newsletter counts mismatch: active=% total=%',
            manual_newsletter_active, manual_newsletter_total;
    END IF;

    IF manual_push_active <> 1 OR manual_push_total <> 2 THEN
        RAISE EXCEPTION 'Manual push counts mismatch: active=% total=%',
            manual_push_active, manual_push_total;
    END IF;

    rpc := public.get_admin_analytics(30, 10);

    SELECT COALESCE(
        (elem ->> 'save_count')::int,
        0
    ) INTO rpc_saved_a
    FROM jsonb_array_elements(rpc -> 'top_saved_cards') AS elem
    WHERE (elem ->> 'card_id')::uuid = card_a_id;

    SELECT COALESCE(
        (elem ->> 'save_count')::int,
        0
    ) INTO rpc_saved_b
    FROM jsonb_array_elements(rpc -> 'top_saved_cards') AS elem
    WHERE (elem ->> 'card_id')::uuid = card_b_id;

    SELECT COALESCE(
        (elem ->> 'like_count')::int,
        0
    ) INTO rpc_liked_a
    FROM jsonb_array_elements(rpc -> 'top_liked_cards') AS elem
    WHERE (elem ->> 'card_id')::uuid = card_a_id;

    SELECT COALESCE(
        (elem ->> 'like_count')::int,
        0
    ) INTO rpc_liked_b
    FROM jsonb_array_elements(rpc -> 'top_liked_cards') AS elem
    WHERE (elem ->> 'card_id')::uuid = card_b_id;

    IF rpc_saved_a <> manual_saved_a OR rpc_saved_b <> manual_saved_b THEN
        RAISE EXCEPTION 'RPC save counts mismatch: rpc a=% b=% manual a=% b=%',
            rpc_saved_a, rpc_saved_b, manual_saved_a, manual_saved_b;
    END IF;

    IF rpc_liked_a <> manual_liked_a OR rpc_liked_b <> manual_liked_b THEN
        RAISE EXCEPTION 'RPC like counts mismatch: rpc a=% b=% manual a=% b=%',
            rpc_liked_a, rpc_liked_b, manual_liked_a, manual_liked_b;
    END IF;

    IF (rpc -> 'submission_volume' ->> 'total_in_window')::int < manual_submissions THEN
        RAISE EXCEPTION 'RPC submission total too low: rpc=% manual verify=%',
            rpc -> 'submission_volume' ->> 'total_in_window', manual_submissions;
    END IF;

    IF (rpc -> 'newsletter_subscribers' ->> 'active')::int < manual_newsletter_active THEN
        RAISE EXCEPTION 'RPC newsletter active count too low';
    END IF;

    IF (rpc -> 'push_subscribers' ->> 'active')::int < manual_push_active THEN
        RAISE EXCEPTION 'RPC push active count too low';
    END IF;

    RAISE NOTICE 'verify_admin_analytics: all checks passed';
END $$;

-- Zero-data RPC smoke test (empty database subset should not error)
SELECT public.get_admin_analytics(30, 10) IS NOT NULL AS empty_database_rpc_ok;
