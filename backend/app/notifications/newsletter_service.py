from __future__ import annotations

import secrets
from datetime import UTC, datetime

from app.auth.service import get_supabase_client
from app.core.errors import not_found, validation_error
from app.notifications.schemas import NewsletterSubscriptionResponse


def subscribe_newsletter(
    *, email: str, enabled: bool
) -> NewsletterSubscriptionResponse:
    normalized_email = email.strip().lower()
    client = get_supabase_client()

    existing_response = (
        client.table("newsletter_subscriptions")
        .select("id, email, enabled")
        .eq("email", normalized_email)
        .limit(1)
        .execute()
    )

    if existing_response.data:
        row = existing_response.data[0]
        if bool(row["enabled"]) != enabled:
            updated_at = datetime.now(UTC).isoformat()
            update_response = (
                client.table("newsletter_subscriptions")
                .update({"enabled": enabled, "updated_at": updated_at})
                .eq("id", row["id"])
                .execute()
            )
            row = update_response.data[0]
        return NewsletterSubscriptionResponse(
            email=str(row["email"]),
            enabled=bool(row["enabled"]),
        )

    if not enabled:
        return NewsletterSubscriptionResponse(
            email=normalized_email,
            enabled=False,
        )

    insert_response = (
        client.table("newsletter_subscriptions")
        .insert(
            {
                "email": normalized_email,
                "enabled": True,
                "unsubscribe_token": secrets.token_urlsafe(32),
            }
        )
        .execute()
    )
    row = insert_response.data[0]
    return NewsletterSubscriptionResponse(
        email=str(row["email"]),
        enabled=bool(row["enabled"]),
    )


def unsubscribe_newsletter_by_token(token: str) -> NewsletterSubscriptionResponse:
    cleaned_token = token.strip()
    if not cleaned_token:
        raise validation_error("Unsubscribe token is required.")

    client = get_supabase_client()
    existing_response = (
        client.table("newsletter_subscriptions")
        .select("id, email, enabled")
        .eq("unsubscribe_token", cleaned_token)
        .limit(1)
        .execute()
    )
    if not existing_response.data:
        raise not_found("That unsubscribe link is invalid or has expired.")

    row = existing_response.data[0]
    if bool(row["enabled"]):
        updated_at = datetime.now(UTC).isoformat()
        update_response = (
            client.table("newsletter_subscriptions")
            .update({"enabled": False, "updated_at": updated_at})
            .eq("id", row["id"])
            .execute()
        )
        row = update_response.data[0]

    return NewsletterSubscriptionResponse(
        email=str(row["email"]),
        enabled=bool(row["enabled"]),
    )
