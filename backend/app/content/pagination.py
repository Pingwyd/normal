import base64
import json
from datetime import UTC, datetime
from uuid import UUID

from app.core.errors import validation_error


def encode_cursor(published_at: datetime, card_id: UUID) -> str:
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=UTC)
    payload = {
        "published_at": published_at.isoformat(),
        "id": str(card_id),
    }
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8"))
    return encoded.decode("utf-8")


def decode_cursor(cursor: str) -> tuple[datetime, UUID]:
    try:
        decoded = base64.urlsafe_b64decode(cursor.encode("utf-8"))
        payload = json.loads(decoded)
        published_at = datetime.fromisoformat(payload["published_at"])
        card_id = UUID(payload["id"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise validation_error("That pagination cursor is invalid.") from exc

    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=UTC)

    return published_at, card_id
