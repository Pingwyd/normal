-- Step 1: Core content and reference tables
-- Spec: docs/03-data-modeling.md section 1

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE card_status AS ENUM (
    'draft',
    'published',
    'unpublished'
);

CREATE TYPE source_tier AS ENUM (
    'peer_reviewed',
    'expert_written',
    'self_report'
);

CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    phase integer NOT NULL,
    requires_clinical_review boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid NOT NULL REFERENCES categories (id),
    question text NOT NULL,
    brief text NOT NULL,
    slug text NOT NULL UNIQUE,
    save_count integer NOT NULL DEFAULT 0,
    status card_status NOT NULL DEFAULT 'draft',
    last_reviewed_by uuid,
    last_reviewed_at timestamptz,
    next_review_due timestamptz,
    requires_clinical_review boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE card_tags (
    card_id uuid NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, tag_id)
);

CREATE TABLE content_blocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id uuid NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
    position integer NOT NULL,
    type text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id uuid NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
    title text NOT NULL,
    author_or_org text NOT NULL,
    url text NOT NULL,
    tier source_tier NOT NULL,
    published_date date,
    accessed_date date NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE card_related_overrides (
    card_id uuid NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
    related_card_id uuid NOT NULL REFERENCES cards (id) ON DELETE CASCADE,
    position integer NOT NULL,
    PRIMARY KEY (card_id, related_card_id)
);

CREATE INDEX idx_cards_question_trgm ON cards USING gin (question gin_trgm_ops);

CREATE INDEX idx_cards_category_id ON cards (category_id);

CREATE INDEX idx_cards_next_review_due ON cards (next_review_due);

CREATE INDEX idx_content_blocks_card_id_position ON content_blocks (card_id, position);
