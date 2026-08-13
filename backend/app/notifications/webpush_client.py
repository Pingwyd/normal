from __future__ import annotations

import json

from pywebpush import WebPushException, webpush

from app.core.config import get_settings
from app.core.errors import validation_error


def send_push_notification(
    *,
    endpoint: str,
    keys: dict[str, str],
    payload: dict[str, str],
) -> None:
    settings = get_settings()
    if not settings.vapid_private_key or not settings.vapid_contact_email:
        raise validation_error("Push delivery is not configured.")

    contact = settings.vapid_contact_email.strip()
    if contact.startswith("mailto:"):
        contact = contact.removeprefix("mailto:")

    try:
        webpush(
            subscription_info={"endpoint": endpoint, "keys": keys},
            data=json.dumps(payload),
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": f"mailto:{contact}"},
        )
    except WebPushException as exc:
        raise validation_error("Push delivery failed. Try again later.") from exc
