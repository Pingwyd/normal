-- Trigram duplicate assist for public submissions (pg_trgm % operator, default threshold 0.3)
CREATE OR REPLACE FUNCTION public.find_likely_duplicate_card(p_question_text text)
RETURNS TABLE (
    card_id uuid,
    question text,
    slug text,
    similarity_score real
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c.id,
        c.question,
        c.slug,
        similarity(c.question, p_question_text) AS similarity_score
    FROM cards AS c
    WHERE c.status = 'published'
      AND c.question OPERATOR(public.%) p_question_text
    ORDER BY similarity_score DESC
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.find_likely_duplicate_card(text) TO service_role;
