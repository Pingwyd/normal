from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.core.errors import ApiError
from app.core.rate_limit import reset_rate_limiters
from app.main import app
from app.notifications.newsletter_service import (
    subscribe_newsletter,
    unsubscribe_newsletter_by_token,
)
from app.notifications.push_service import upsert_push_subscription
from app.notifications.schemas import (
    NewsletterSubscriptionResponse,
    NotificationSendChannel,
    NotificationTestSendResponse,
    PushSubscriptionResponse,
)

client = TestClient(app)

ACCOUNT_A = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
ACCOUNT_B = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
SUBSCRIPTION_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
PUSH_ENDPOINT = "https://push.example.com/subscription/browser-endpoint"
PUSH_KEYS = {"p256dh": "test-p256dh-key", "auth": "test-auth-key"}


def setup_function() -> None:
    reset_rate_limiters()


def _build_push_supabase_mock(
    *,
    existing_row: dict[str, object] | None,
    upsert_row: dict[str, object],
) -> MagicMock:
    client = MagicMock()
    table = MagicMock()
    client.table.return_value = table

    select = MagicMock()
    table.select.return_value = select
    select.eq.return_value = select
    select.limit.return_value = select
    select.execute.return_value = MagicMock(data=[existing_row] if existing_row else [])

    upsert = MagicMock()
    table.upsert.return_value = upsert
    upsert.execute.return_value = MagicMock(data=[upsert_row])

    return client


@patch("app.notifications.push_service.get_supabase_client")
def test_upsert_push_subscription_inserts_anonymous_row(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_push_supabase_mock(
        existing_row=None,
        upsert_row={
            "id": str(SUBSCRIPTION_ID),
            "endpoint": PUSH_ENDPOINT,
            "enabled": True,
            "account_id": None,
        },
    )

    result = upsert_push_subscription(
        endpoint=PUSH_ENDPOINT,
        keys=PUSH_KEYS,
        enabled=True,
        account_id=None,
    )

    assert result.id == SUBSCRIPTION_ID
    assert result.account_id is None
    assert result.reassigned is False


@patch("app.notifications.push_service.get_supabase_client")
def test_upsert_push_subscription_reassigns_existing_endpoint(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_push_supabase_mock(
        existing_row={"id": str(SUBSCRIPTION_ID), "account_id": str(ACCOUNT_A)},
        upsert_row={
            "id": str(SUBSCRIPTION_ID),
            "endpoint": PUSH_ENDPOINT,
            "enabled": True,
            "account_id": str(ACCOUNT_B),
        },
    )

    result = upsert_push_subscription(
        endpoint=PUSH_ENDPOINT,
        keys=PUSH_KEYS,
        enabled=True,
        account_id=ACCOUNT_B,
    )

    assert result.account_id == ACCOUNT_B
    assert result.reassigned is True

    upsert_payload = (
        mock_get_client.return_value.table.return_value.upsert.call_args.args[0]
    )
    assert upsert_payload["account_id"] == str(ACCOUNT_B)
    assert upsert_payload["enabled"] is True


@patch("app.notifications.push_service.get_supabase_client")
def test_upsert_push_subscription_toggles_enabled_without_delete(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_push_supabase_mock(
        existing_row={"id": str(SUBSCRIPTION_ID), "account_id": str(ACCOUNT_A)},
        upsert_row={
            "id": str(SUBSCRIPTION_ID),
            "endpoint": PUSH_ENDPOINT,
            "enabled": False,
            "account_id": str(ACCOUNT_A),
        },
    )

    result = upsert_push_subscription(
        endpoint=PUSH_ENDPOINT,
        keys=PUSH_KEYS,
        enabled=False,
        account_id=ACCOUNT_A,
    )

    assert result.enabled is False
    assert result.reassigned is False


@patch("app.notifications.push_service.get_supabase_client")
def test_upsert_push_subscription_rejects_invalid_endpoint(
    mock_get_client: MagicMock,
) -> None:
    with pytest.raises(ApiError) as exc_info:
        upsert_push_subscription(
            endpoint="not-a-url",
            keys=PUSH_KEYS,
            enabled=True,
            account_id=None,
        )

    assert exc_info.value.code == "VALIDATION_ERROR"
    mock_get_client.assert_not_called()


@patch("app.notifications.router.upsert_push_subscription")
def test_push_subscription_route_returns_envelope(mock_upsert: MagicMock) -> None:
    mock_upsert.return_value = PushSubscriptionResponse(
        id=SUBSCRIPTION_ID,
        endpoint=PUSH_ENDPOINT,
        enabled=True,
        account_id=ACCOUNT_A,
        reassigned=True,
    )

    response = client.post(
        "/v1/push-subscriptions",
        json={
            "endpoint": PUSH_ENDPOINT,
            "keys": PUSH_KEYS,
            "enabled": True,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"]["id"] == str(SUBSCRIPTION_ID)
    assert body["data"]["reassigned"] is True


def _build_newsletter_supabase_mock(
    *,
    existing_row: dict[str, object] | None,
    insert_row: dict[str, object] | None = None,
    update_row: dict[str, object] | None = None,
) -> MagicMock:
    client = MagicMock()
    table = MagicMock()
    client.table.return_value = table

    select = MagicMock()
    table.select.return_value = select
    select.eq.return_value = select
    select.limit.return_value = select
    select.execute.return_value = MagicMock(data=[existing_row] if existing_row else [])

    if insert_row is not None:
        insert = MagicMock()
        table.insert.return_value = insert
        insert.execute.return_value = MagicMock(data=[insert_row])

    if update_row is not None:
        update = MagicMock()
        table.update.return_value = update
        update.eq.return_value = update
        update.execute.return_value = MagicMock(data=[update_row])

    return client


@patch("app.notifications.newsletter_service.get_supabase_client")
def test_subscribe_newsletter_creates_row_with_token(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_newsletter_supabase_mock(
        existing_row=None,
        insert_row={
            "email": "reader@example.com",
            "enabled": True,
        },
    )

    result = subscribe_newsletter(email="Reader@Example.com", enabled=True)

    assert result.email == "reader@example.com"
    assert result.enabled is True

    insert_payload = (
        mock_get_client.return_value.table.return_value.insert.call_args.args[0]
    )
    assert insert_payload["email"] == "reader@example.com"
    assert insert_payload["enabled"] is True
    assert len(insert_payload["unsubscribe_token"]) >= 32


@patch("app.notifications.newsletter_service.get_supabase_client")
def test_subscribe_newsletter_toggles_existing_row(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_newsletter_supabase_mock(
        existing_row={
            "id": "11111111-1111-1111-1111-111111111111",
            "email": "reader@example.com",
            "enabled": True,
        },
        update_row={
            "email": "reader@example.com",
            "enabled": False,
        },
    )

    result = subscribe_newsletter(email="reader@example.com", enabled=False)

    assert result.enabled is False


@patch("app.notifications.newsletter_service.get_supabase_client")
def test_subscribe_newsletter_disable_without_row_is_idempotent(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_newsletter_supabase_mock(existing_row=None)

    result = subscribe_newsletter(email="reader@example.com", enabled=False)

    assert result.email == "reader@example.com"
    assert result.enabled is False
    mock_get_client.return_value.table.return_value.insert.assert_not_called()


@patch("app.notifications.newsletter_service.get_supabase_client")
def test_unsubscribe_newsletter_by_token_disables_row(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_newsletter_supabase_mock(
        existing_row={
            "id": "11111111-1111-1111-1111-111111111111",
            "email": "reader@example.com",
            "enabled": True,
        },
        update_row={
            "email": "reader@example.com",
            "enabled": False,
        },
    )

    result = unsubscribe_newsletter_by_token("valid-unsubscribe-token")

    assert result.enabled is False
    assert result.email == "reader@example.com"


@patch("app.notifications.newsletter_service.get_supabase_client")
def test_unsubscribe_newsletter_by_token_not_found(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_newsletter_supabase_mock(existing_row=None)

    with pytest.raises(ApiError) as exc_info:
        unsubscribe_newsletter_by_token("missing-token")

    assert exc_info.value.code == "NOT_FOUND"


@patch("app.notifications.router.subscribe_newsletter")
def test_newsletter_route_returns_envelope(mock_subscribe: MagicMock) -> None:
    mock_subscribe.return_value = NewsletterSubscriptionResponse(
        email="reader@example.com",
        enabled=True,
    )

    response = client.post(
        "/v1/newsletter",
        json={"email": "reader@example.com", "enabled": True},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"]["email"] == "reader@example.com"
    assert "unsubscribe_token" not in body["data"]


@patch("app.notifications.router.unsubscribe_newsletter_by_token")
def test_newsletter_unsubscribe_route_returns_envelope(
    mock_unsubscribe: MagicMock,
) -> None:
    mock_unsubscribe.return_value = NewsletterSubscriptionResponse(
        email="reader@example.com",
        enabled=False,
    )

    response = client.get(
        "/v1/newsletter/unsubscribe",
        params={"token": "valid-unsubscribe-token"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["enabled"] is False


NEWSLETTER_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
PUSH_SUBSCRIPTION_ROW_ID = UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")


def _build_newsletter_delivery_supabase_mock(
    *,
    row: dict[str, object] | None,
) -> MagicMock:
    client = MagicMock()
    table = MagicMock()
    client.table.return_value = table

    select = MagicMock()
    table.select.return_value = select
    select.eq.return_value = select
    select.limit.return_value = select
    select.execute.return_value = MagicMock(data=[row] if row else [])
    return client


def _build_push_delivery_supabase_mock(
    *,
    row: dict[str, object] | None,
) -> MagicMock:
    return _build_newsletter_delivery_supabase_mock(row=row)


@patch("app.notifications.delivery_service.send_email")
@patch("app.notifications.delivery_service.get_supabase_client")
def test_send_test_newsletter_email_delivers_when_enabled(
    mock_get_client: MagicMock,
    mock_send_email: MagicMock,
) -> None:
    mock_get_client.return_value = _build_newsletter_delivery_supabase_mock(
        row={
            "id": str(NEWSLETTER_ID),
            "email": "reader@example.com",
            "enabled": True,
            "unsubscribe_token": "stable-unsubscribe-token",
        }
    )
    mock_send_email.return_value = "resend-message-id"

    from app.notifications.delivery_service import send_test_newsletter_email

    result = send_test_newsletter_email(email="reader@example.com")

    assert result.delivered is True
    assert result.channel == "newsletter"
    assert result.provider_message_id == "resend-message-id"
    mock_send_email.assert_called_once()
    assert "stable-unsubscribe-token" in mock_send_email.call_args.kwargs["html"]


@patch("app.notifications.delivery_service.get_supabase_client")
def test_send_test_newsletter_email_rejects_disabled_subscription(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_newsletter_delivery_supabase_mock(
        row={
            "id": str(NEWSLETTER_ID),
            "email": "reader@example.com",
            "enabled": False,
            "unsubscribe_token": "stable-unsubscribe-token",
        }
    )

    from app.notifications.delivery_service import send_test_newsletter_email

    with pytest.raises(ApiError) as exc_info:
        send_test_newsletter_email(email="reader@example.com")

    assert exc_info.value.code == "VALIDATION_ERROR"


@patch("app.notifications.delivery_service.send_push_notification")
@patch("app.notifications.delivery_service.get_supabase_client")
def test_send_test_push_notification_delivers_when_enabled(
    mock_get_client: MagicMock,
    mock_send_push: MagicMock,
) -> None:
    mock_get_client.return_value = _build_push_delivery_supabase_mock(
        row={
            "id": str(PUSH_SUBSCRIPTION_ROW_ID),
            "endpoint": PUSH_ENDPOINT,
            "enabled": True,
            "keys": PUSH_KEYS,
        }
    )

    from app.notifications.delivery_service import send_test_push_notification

    result = send_test_push_notification(subscription_id=PUSH_SUBSCRIPTION_ROW_ID)

    assert result.delivered is True
    assert result.channel == "push"
    mock_send_push.assert_called_once()


@patch("app.notifications.delivery_service.get_supabase_client")
def test_send_test_push_notification_rejects_disabled_subscription(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_push_delivery_supabase_mock(
        row={
            "id": str(PUSH_SUBSCRIPTION_ROW_ID),
            "endpoint": PUSH_ENDPOINT,
            "enabled": False,
            "keys": PUSH_KEYS,
        }
    )

    from app.notifications.delivery_service import send_test_push_notification

    with pytest.raises(ApiError) as exc_info:
        send_test_push_notification(subscription_id=PUSH_SUBSCRIPTION_ROW_ID)

    assert exc_info.value.code == "VALIDATION_ERROR"


@patch("app.notifications.admin_router.send_test_newsletter_email")
def test_admin_test_send_newsletter_requires_admin(
    mock_send: MagicMock,
) -> None:
    from app.auth.dependencies import get_current_admin
    from app.auth.models import AdminContext, AdminRole

    admin_context = AdminContext(
        auth_id=UUID("11111111-1111-1111-1111-111111111111"),
        admin_id=UUID("22222222-2222-2222-2222-222222222222"),
        role=AdminRole.FOUNDER,
        display_name="Founder User",
    )
    app.dependency_overrides[get_current_admin] = lambda: admin_context
    mock_send.return_value = NotificationTestSendResponse(
        channel=NotificationSendChannel.NEWSLETTER,
        delivered=True,
        target="reader@example.com",
        provider_message_id="resend-message-id",
    )

    try:
        response = client.post(
            "/v1/admin/notifications/test-send",
            headers={"Authorization": "Bearer test-token"},
            json={"channel": "newsletter", "email": "reader@example.com"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["delivered"] is True
    mock_send.assert_called_once_with(email="reader@example.com")


def test_admin_test_send_requires_authentication() -> None:
    response = client.post(
        "/v1/admin/notifications/test-send",
        json={"channel": "newsletter", "email": "reader@example.com"},
    )

    assert response.status_code == 401
