from __future__ import annotations

from uuid import UUID

from app.auth.service import get_supabase_client
from app.core.config import get_settings
from app.core.errors import not_found, validation_error
from app.notifications.resend_client import send_email
from app.notifications.schemas import NotificationTestSendResponse
from app.notifications.webpush_client import send_push_notification

NEWSLETTER_TEST_SUBJECT = "Normal newsletter test"
PUSH_TEST_TITLE = "Normal push test"
PUSH_TEST_BODY = "This is a test push notification from Normal."


def _frontend_base_url() -> str:
    settings = get_settings()
    if settings.frontend_base_url:
        return settings.frontend_base_url.rstrip("/")
    return settings.cors_origins[0].rstrip("/")


def build_newsletter_unsubscribe_url(unsubscribe_token: str) -> str:
    return f"{_frontend_base_url()}/newsletter/unsubscribe?token={unsubscribe_token}"


def _get_enabled_newsletter_subscription(email: str) -> dict[str, object]:
    normalized_email = email.strip().lower()
    client = get_supabase_client()
    response = (
        client.table("newsletter_subscriptions")
        .select("id, email, enabled, unsubscribe_token")
        .eq("email", normalized_email)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise not_found("That newsletter subscription could not be found.")
    row = response.data[0]
    if not bool(row["enabled"]):
        raise validation_error("Newsletter subscription is disabled.")
    return row


def _get_enabled_push_subscription(subscription_id: UUID) -> dict[str, object]:
    client = get_supabase_client()
    response = (
        client.table("push_subscriptions")
        .select("id, endpoint, keys, enabled")
        .eq("id", str(subscription_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise not_found("That push subscription could not be found.")
    row = response.data[0]
    if not bool(row["enabled"]):
        raise validation_error("Push subscription is disabled.")
    return row


def send_test_newsletter_email(*, email: str) -> NotificationTestSendResponse:
    row = _get_enabled_newsletter_subscription(email)
    unsubscribe_url = build_newsletter_unsubscribe_url(str(row["unsubscribe_token"]))
    html = (
        "<p>This is a test newsletter email from Normal.</p>"
        f'<p><a href="{unsubscribe_url}">Unsubscribe</a></p>'
    )
    message_id = send_email(
        to_email=str(row["email"]),
        subject=NEWSLETTER_TEST_SUBJECT,
        html=html,
    )
    return NotificationTestSendResponse(
        channel="newsletter",
        delivered=True,
        target=str(row["email"]),
        provider_message_id=message_id,
    )


def send_test_push_notification(
    *, subscription_id: UUID
) -> NotificationTestSendResponse:
    row = _get_enabled_push_subscription(subscription_id)
    keys = row["keys"]
    if not isinstance(keys, dict):
        raise validation_error("Push subscription keys are invalid.")

    send_push_notification(
        endpoint=str(row["endpoint"]),
        keys={
            "p256dh": str(keys.get("p256dh", "")),
            "auth": str(keys.get("auth", "")),
        },
        payload={
            "title": PUSH_TEST_TITLE,
            "body": PUSH_TEST_BODY,
        },
    )
    return NotificationTestSendResponse(
        channel="push",
        delivered=True,
        target=str(row["endpoint"]),
        provider_message_id=None,
    )
