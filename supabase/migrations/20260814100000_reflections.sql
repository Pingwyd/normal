-- Reflections content type (founder voice, separate from cards)
-- Spec: docs/09-reflections-feature.md section 2

CREATE TYPE reflection_format AS ENUM (
    'short',
    'long'
);

CREATE TYPE reflection_status AS ENUM (
    'draft',
    'published'
);

CREATE TABLE reflections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    brief text NOT NULL,
    format reflection_format NOT NULL,
    status reflection_status NOT NULL DEFAULT 'draft',
    is_crisis_adjacent boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reflection_tags (
    reflection_id uuid NOT NULL REFERENCES reflections (id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    PRIMARY KEY (reflection_id, tag_id)
);

CREATE TABLE reflection_blocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reflection_id uuid NOT NULL REFERENCES reflections (id) ON DELETE CASCADE,
    position integer NOT NULL,
    type text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    context_note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_reflections_published_at_id ON reflections (published_at DESC, id DESC);

CREATE INDEX idx_reflections_format ON reflections (format);

CREATE INDEX idx_reflection_blocks_reflection_id_position
    ON reflection_blocks (reflection_id, position);

ALTER TABLE reflections DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_tags DISABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_blocks DISABLE ROW LEVEL SECURITY;
