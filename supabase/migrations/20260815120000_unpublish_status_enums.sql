-- Align content status enums and extend review_log for unpublish/delete lifecycle.
-- Spec: docs/11-unpublish-delete.md section 3

ALTER TYPE daily_content_status ADD VALUE IF NOT EXISTS 'unpublished';

ALTER TYPE reflection_status ADD VALUE IF NOT EXISTS 'unpublished';

ALTER TYPE review_entity_type ADD VALUE IF NOT EXISTS 'affirmation';
ALTER TYPE review_entity_type ADD VALUE IF NOT EXISTS 'quote';
ALTER TYPE review_entity_type ADD VALUE IF NOT EXISTS 'reflection';
