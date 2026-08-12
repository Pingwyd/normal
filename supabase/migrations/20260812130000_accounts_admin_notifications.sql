-- Step 2: Accounts, submissions, engagement, admin, and notification tables
-- Spec: docs/03-data-modeling.md sections 2 through 7
-- RLS: docs/02-system-design.md section 4

CREATE TYPE account_theme AS ENUM (
    'light',
    'dark',
    'system'
);

CREATE TYPE account_layout AS ENUM (
    'classic',
    'new'
);

CREATE TYPE favorite_content_type AS ENUM (
    'card',
    'affirmation',
    'quote'
);

CREATE TYPE submission_status AS ENUM (
    'submitted',
    'in_review',
    'rejected',
    'drafted',
    'published'
);

CREATE TYPE reported_issue_status AS ENUM (
    'open',
    'in_review',
    'resolved',
    'dismissed'
);

CREATE TYPE daily_content_status AS ENUM (
    'draft',
    'published'
);

CREATE TYPE admin_role AS ENUM (
    'founder',
    'clinical_reviewer'
);

CREATE TYPE review_entity_type AS ENUM (
    'card',
    'submission',
    'reported_issue'
);

CREATE TABLE admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id uuid NOT NULL UNIQUE,
    role admin_role NOT NULL,
    display_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    theme_preference account_theme NOT NULL DEFAULT 'system',
    layout_version account_layout NOT NULL DEFAULT 'classic',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE affirmations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    text text NOT NULL,
    status daily_content_status NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    text text NOT NULL,
    attributed_to text NOT NULL,
    source_url text,
    status daily_content_status NOT NULL DEFAULT 'draft',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE newsletter_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    enabled boolean NOT NULL DEFAULT true,
    unsubscribe_token text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cards
    ADD CONSTRAINT cards_last_reviewed_by_fkey
    FOREIGN KEY (last_reviewed_by) REFERENCES admin_users (id);

CREATE TABLE recovery_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    code_hash text NOT NULL,
    used_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid REFERENCES accounts (id) ON DELETE CASCADE,
    content_type favorite_content_type NOT NULL,
    content_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (account_id, content_type, content_id)
);

CREATE TABLE affirmation_tags (
    affirmation_id uuid NOT NULL REFERENCES affirmations (id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (affirmation_id, tag_id)
);

CREATE TABLE card_likes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id uuid NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
    account_id uuid REFERENCES accounts (id) ON DELETE SET NULL,
    device_identifier text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid REFERENCES accounts (id) ON DELETE SET NULL,
    endpoint text NOT NULL UNIQUE,
    keys jsonb NOT NULL,
    enabled boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text text NOT NULL,
    status submission_status NOT NULL DEFAULT 'submitted',
    likely_duplicate_of uuid REFERENCES cards (id),
    resulting_card_id uuid REFERENCES cards (id),
    handled_by uuid REFERENCES admin_users (id),
    decision_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reported_issues (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id uuid NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
    description text NOT NULL,
    status reported_issue_status NOT NULL DEFAULT 'open',
    handled_by uuid REFERENCES admin_users (id),
    resolution_notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE review_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type review_entity_type NOT NULL,
    entity_id uuid NOT NULL,
    action text NOT NULL,
    performed_by uuid NOT NULL REFERENCES admin_users (id),
    performed_by_name_snapshot text NOT NULL,
    notes text,
    timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_question_text_trgm
    ON submissions USING gin (question_text gin_trgm_ops);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_proc AS p
        INNER JOIN pg_namespace AS n ON n.oid = p.pronamespace
        WHERE n.nspname = 'auth'
          AND p.proname = 'uid'
    ) THEN
        EXECUTE 'CREATE SCHEMA IF NOT EXISTS auth';
        EXECUTE $auth$
            CREATE FUNCTION auth.uid()
            RETURNS uuid
            LANGUAGE sql
            STABLE
            AS $body$
                SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
            $body$;
        $auth$;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM admin_users
        WHERE auth_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION current_admin_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id
    FROM admin_users
    WHERE auth_id = auth.uid()
    LIMIT 1;
$$;

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users FORCE ROW LEVEL SECURITY;

CREATE POLICY admin_users_select_admin
    ON admin_users
    FOR SELECT
    TO authenticated
    USING (is_admin_user());

CREATE POLICY admin_users_insert_admin
    ON admin_users
    FOR INSERT
    TO authenticated
    WITH CHECK (is_admin_user());

CREATE POLICY admin_users_update_admin
    ON admin_users
    FOR UPDATE
    TO authenticated
    USING (is_admin_user())
    WITH CHECK (is_admin_user());

CREATE POLICY admin_users_delete_admin
    ON admin_users
    FOR DELETE
    TO authenticated
    USING (is_admin_user());

ALTER TABLE review_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_log FORCE ROW LEVEL SECURITY;

CREATE POLICY review_log_select_admin
    ON review_log
    FOR SELECT
    TO authenticated
    USING (is_admin_user());

CREATE POLICY review_log_insert_admin
    ON review_log
    FOR INSERT
    TO authenticated
    WITH CHECK (
        is_admin_user()
        AND performed_by = current_admin_user_id()
    );

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON admin_users TO authenticated;
GRANT SELECT, INSERT ON review_log TO authenticated;

REVOKE EXECUTE ON FUNCTION is_admin_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION current_admin_user_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_admin_user() TO authenticated;
GRANT EXECUTE ON FUNCTION current_admin_user_id() TO authenticated;
