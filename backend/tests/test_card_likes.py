from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.accounts.security import issue_account_access_token
from app.content.likes_dependencies import LikeContext
from app.content.likes_schemas import CardLikeToggleResponse
from app.content.likes_service import toggle_card_like
from app.core.errors import ApiError
from app.main import app

client = TestClient(app)

ACCOUNT_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CARD_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
LIKE_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
DEVICE_ID = "device-uuid-12345678"


def _build_supabase_mock(
    execute_responses: list[MagicMock],
) -> MagicMock:
    client = MagicMock()
    table = MagicMock()
    select = MagicMock()
    client.table.return_value = table
    table.select.return_value = select
    select.eq.return_value = select
    select.is_.return_value = select
    select.limit.return_value = select
    select.execute.side_effect = execute_responses
    table.insert.return_value = MagicMock(
        execute=MagicMock(return_value=MagicMock(data=[{"id": str(LIKE_ID)}]))
    )
    table.delete.return_value = MagicMock(
        eq=MagicMock(
            return_value=MagicMock(execute=MagicMock(return_value=MagicMock(data=[])))
        )
    )
    return client


@patch("app.content.likes_service.get_supabase_client")
def test_toggle_card_like_creates_then_removes_like(mock_get_client: MagicMock) -> None:
    mock_get_client.return_value = _build_supabase_mock(
        [
            MagicMock(data=[{"id": str(CARD_ID)}]),
            MagicMock(data=[]),
            MagicMock(count=1, data=[]),
            MagicMock(data=[{"id": str(CARD_ID)}]),
            MagicMock(data=[{"id": str(LIKE_ID)}]),
            MagicMock(count=0, data=[]),
        ]
    )

    context = LikeContext(account_id=None, device_identifier=DEVICE_ID)

    first = toggle_card_like(CARD_ID, context)
    second = toggle_card_like(CARD_ID, context)

    assert first.liked is True
    assert first.like_count == 1
    assert second.liked is False
    assert second.like_count == 0


@patch("app.content.likes_service.get_supabase_client")
def test_toggle_card_like_uses_account_id_when_present(
    mock_get_client: MagicMock,
) -> None:
    mock_client = _build_supabase_mock(
        [
            MagicMock(data=[{"id": str(CARD_ID)}]),
            MagicMock(data=[]),
            MagicMock(count=1, data=[]),
        ]
    )
    mock_get_client.return_value = mock_client

    context = LikeContext(account_id=ACCOUNT_ID, device_identifier=None)
    result = toggle_card_like(CARD_ID, context)

    insert_payload = mock_client.table.return_value.insert.call_args.args[0]
    assert insert_payload["account_id"] == str(ACCOUNT_ID)
    assert "device_identifier" not in insert_payload
    assert result.liked is True
    assert result.like_count == 1


@patch("app.content.likes_service.get_supabase_client")
def test_toggle_card_like_not_found_when_card_missing(
    mock_get_client: MagicMock,
) -> None:
    mock_get_client.return_value = _build_supabase_mock([MagicMock(data=[])])

    context = LikeContext(account_id=None, device_identifier=DEVICE_ID)

    with pytest.raises(ApiError) as exc_info:
        toggle_card_like(CARD_ID, context)

    assert exc_info.value.status_code == 404


def test_toggle_card_like_requires_device_id_when_anonymous() -> None:
    response = client.post(f"/v1/cards/{CARD_ID}/like")

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@patch("app.content.router.toggle_card_like")
@patch("app.content.likes_dependencies.get_current_account")
def test_toggle_card_like_with_account_token(
    mock_get_account: MagicMock,
    mock_toggle: MagicMock,
) -> None:
    from app.accounts.dependencies import AccountContext

    mock_get_account.return_value = AccountContext(
        account_id=ACCOUNT_ID,
        username="testuser",
    )
    mock_toggle.return_value = CardLikeToggleResponse(liked=True, like_count=4)
    token = issue_account_access_token(ACCOUNT_ID)

    response = client.post(
        f"/v1/cards/{CARD_ID}/like",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["data"] == {"liked": True, "like_count": 4}
    context = mock_toggle.call_args.args[1]
    assert context.account_id == ACCOUNT_ID
    assert context.device_identifier is None


@patch("app.content.likes_service.get_supabase_client")
def test_get_card_like_status_returns_current_state(
    mock_get_client: MagicMock,
) -> None:
    from app.content.likes_service import get_card_like_status

    mock_get_client.return_value = _build_supabase_mock(
        [
            MagicMock(data=[{"id": str(CARD_ID)}]),
            MagicMock(data=[{"id": str(LIKE_ID)}]),
            MagicMock(count=3, data=[]),
        ]
    )

    context = LikeContext(account_id=None, device_identifier=DEVICE_ID)
    result = get_card_like_status(CARD_ID, context)

    assert result.liked is True
    assert result.like_count == 3


@patch("app.content.router.toggle_card_like")
def test_toggle_card_like_with_device_header(mock_toggle: MagicMock) -> None:
    mock_toggle.return_value = CardLikeToggleResponse(liked=True, like_count=2)

    response = client.post(
        f"/v1/cards/{CARD_ID}/like",
        headers={"X-Device-Id": DEVICE_ID},
    )

    assert response.status_code == 200
    assert response.json()["data"]["liked"] is True
    context = mock_toggle.call_args.args[1]
    assert context.device_identifier == DEVICE_ID
    assert context.account_id is None
