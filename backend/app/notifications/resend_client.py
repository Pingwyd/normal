from __future__ import annotations

import httpx

from app.core.config import get_settings
from app.core.errors import validation_error


def send_email(*, to_email: str, subject: str, html: str) -> str:
    settings = get_settings()
    if not settings.resend_api_key or not settings.newsletter_from_email:
        raise validation_error("Newsletter delivery is not configured.")

    response = httpx.post(
        "https://api.resend.com/emails",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "from": settings.newsletter_from_email,
            "to": [to_email],
            "subject": subject,
            "html": html,
        },
        timeout=30.0,
    )
    if response.status_code >= 400:
        raise validation_error("Newsletter delivery failed. Try again later.")

    body = response.json()
    message_id = body.get("id")
    if not message_id:
        raise validation_error("Newsletter delivery failed. Try again later.")
    return str(message_id)
