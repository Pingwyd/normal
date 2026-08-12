-- Auth verification seed for live auth module testing.
-- Creates two Supabase Auth users and a clinical_reviewer admin_users row.
-- Safe to re-run: skips rows that already exist.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    founder_id uuid := '11111111-1111-1111-1111-111111111111';
    reviewer_id uuid := '22222222-2222-2222-2222-222222222222';
    founder_email text := 'founder-auth-verify@normal.test';
    reviewer_email text := 'reviewer-auth-verify@normal.test';
    test_password text := 'AuthVerify2026!';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = founder_id) THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            is_sso_user,
            is_anonymous
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            founder_id,
            'authenticated',
            'authenticated',
            founder_email,
            crypt(test_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            '',
            false,
            false
        );

        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            founder_id,
            jsonb_build_object(
                'sub', founder_id::text,
                'email', founder_email
            ),
            'email',
            founder_email,
            NOW(),
            NOW(),
            NOW()
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = reviewer_id) THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            is_sso_user,
            is_anonymous
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            reviewer_id,
            'authenticated',
            'authenticated',
            reviewer_email,
            crypt(test_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            '',
            false,
            false
        );

        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            reviewer_id,
            jsonb_build_object(
                'sub', reviewer_id::text,
                'email', reviewer_email
            ),
            'email',
            reviewer_email,
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
END $$;

INSERT INTO admin_users (auth_id, role, display_name)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'clinical_reviewer',
    'Auth Verify Reviewer'
)
ON CONFLICT (auth_id) DO UPDATE
SET
    role = EXCLUDED.role,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

COMMIT;
