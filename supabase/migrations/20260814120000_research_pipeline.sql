-- Pipeline B: async admin research jobs and per-provider API credentials.
-- Spec: docs/10-ai-research-pipelines.md section 2.1

CREATE TYPE research_job_status AS ENUM (
    'pending',
    'complete',
    'failed'
);

CREATE TYPE research_provider AS ENUM (
    'perplexity',
    'openai',
    'anthropic',
    'google_gemini'
);

CREATE TABLE research_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question text NOT NULL,
    status research_job_status NOT NULL DEFAULT 'pending',
    provider research_provider NOT NULL,
    result jsonb,
    error_message text,
    requested_by uuid NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);

CREATE INDEX research_jobs_requested_by_idx ON research_jobs (requested_by);
CREATE INDEX research_jobs_status_idx ON research_jobs (status);

CREATE TABLE research_provider_credentials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id uuid NOT NULL REFERENCES admin_users (id) ON DELETE CASCADE,
    provider research_provider NOT NULL,
    encrypted_api_key text NOT NULL,
    key_hint text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (admin_user_id, provider)
);

CREATE INDEX research_provider_credentials_admin_idx
    ON research_provider_credentials (admin_user_id);
