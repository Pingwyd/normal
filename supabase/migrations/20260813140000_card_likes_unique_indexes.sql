-- Enforce one like per account or anonymous device per card.
CREATE UNIQUE INDEX card_likes_account_unique
    ON card_likes (card_id, account_id)
    WHERE account_id IS NOT NULL;

CREATE UNIQUE INDEX card_likes_device_unique
    ON card_likes (card_id, device_identifier)
    WHERE account_id IS NULL AND device_identifier IS NOT NULL;
