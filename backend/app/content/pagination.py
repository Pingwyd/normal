import base64
import json
from datetime import UTC, datetime
from uuid import UUID

from app.core.errors import validation_error


def _encode_cursor_payload(payload: dict[str, str]) -> str:
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8"))
    return encoded.decode("utf-8")


def _decode_cursor_payload(cursor: str) -> dict:
    try:
        decoded = base64.urlsafe_b64decode(cursor.encode("utf-8"))
        return json.loads(decoded)
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        raise validation_error("That pagination cursor is invalid.") from exc


def _normalize_timestamp(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value


def encode_cursor(published_at: datetime, card_id: UUID) -> str:
    published_at = _normalize_timestamp(published_at)
    return _encode_cursor_payload(
        {
            "published_at": published_at.isoformat(),
            "id": str(card_id),
        }
    )


def decode_cursor(cursor: str) -> tuple[datetime, UUID]:
    payload = _decode_cursor_payload(cursor)
    try:
        published_at = datetime.fromisoformat(payload["published_at"])
        card_id = UUID(payload["id"])
    except (ValueError, KeyError, TypeError) as exc:
        raise validation_error("That pagination cursor is invalid.") from exc

    return _normalize_timestamp(published_at), card_id


def encode_created_at_cursor(created_at: datetime, record_id: UUID) -> str:
    created_at = _normalize_timestamp(created_at)
    return _encode_cursor_payload(
        {
            "created_at": created_at.isoformat(),
            "id": str(record_id),
        }
    )


def decode_created_at_cursor(cursor: str) -> tuple[datetime, UUID]:
    payload = _decode_cursor_payload(cursor)
    try:
        created_at = datetime.fromisoformat(payload["created_at"])
        record_id = UUID(payload["id"])
    except (ValueError, KeyError, TypeError) as exc:
        raise validation_error("That pagination cursor is invalid.") from exc

    return _normalize_timestamp(created_at), record_id
