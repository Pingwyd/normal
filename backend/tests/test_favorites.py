from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

from fastapi.testclient import TestClient

from app.accounts.security import issue_account_access_token
from app.favorites.schemas import FavoriteContentType, FavoriteItem, LocalFavoriteItem
from app.favorites.service import merge_local_favorites, toggle_account_favorite
from app.main import app

client = TestClient(app)

ACCOUNT_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CARD_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
CARD_ID_2 = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
FAVORITE_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
CREATED_AT = datetime(2026, 8, 12, 12, 0, tzinfo=UTC)

SAMPLE_FAVORITE = FavoriteItem(
    id=FAVORITE_ID,
    content_type=FavoriteContentType.CARD,
    content_id=CARD_ID,
    created_at=CREATED_AT,
)


def test_list_favorites_without_auth_returns_empty() -> None:
    response = client.get("/v1/favorites")

    assert response.status_code == 200
    assert response.json()["data"] == []


def test_toggle_favorite_without_auth_returns_unauthorized() -> None:
    response = client.post(
        "/v1/favorites",
        json={
            "content_type": "card",
            "content_id": str(CARD_ID),
            "favorited": True,
        },
    )

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


@patch("app.favorites.router.list_account_favorites")
@patch("app.favorites.dependencies.get_current_account")
def test_list_favorites_with_auth_returns_account_favorites(
    mock_get_account: MagicMock,
    mock_list_favorites: MagicMock,
) -> None:
    from app.accounts.dependencies import AccountContext

    mock_get_account.return_value = AccountContext(
        account_id=ACCOUNT_ID,
        username="testuser",
    )
    mock_list_favorites.return_value = [SAMPLE_FAVORITE]
    token = issue_account_access_token(ACCOUNT_ID)

    response = client.get(
        "/v1/favorites",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["data"][0]["content_id"] == str(CARD_ID)


@patch("app.favorites.service._adjust_card_save_count")
@patch("app.favorites.service._content_exists")
@patch("app.favorites.service.get_supabase_client")
def test_merge_local_favorites_unions_without_duplicates(
    mock_get_client: MagicMock,
    mock_content_exists: MagicMock,
    mock_adjust_save_count: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock
    mock_content_exists.return_value = True

    favorites_table = MagicMock()
    client_mock.table.return_value = favorites_table

    list_execute = (
        favorites_table.select.return_value.eq.return_value.order.return_value.execute
    )
    list_execute.side_effect = [
        MagicMock(
            data=[
                {
                    "id": str(FAVORITE_ID),
                    "content_type": "card",
                    "content_id": str(CARD_ID),
                    "created_at": CREATED_AT.isoformat(),
                }
            ]
        ),
        MagicMock(
            data=[
                {
                    "id": str(FAVORITE_ID),
                    "content_type": "card",
                    "content_id": str(CARD_ID),
                    "created_at": CREATED_AT.isoformat(),
                },
                {
                    "id": str(UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")),
                    "content_type": "card",
                    "content_id": str(CARD_ID_2),
                    "created_at": CREATED_AT.isoformat(),
                },
            ]
        ),
    ]

    favorites_table.insert.return_value.execute.return_value.data = [
        {
            "id": str(UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")),
            "content_type": "card",
            "content_id": str(CARD_ID_2),
            "created_at": CREATED_AT.isoformat(),
        }
    ]

    merged = merge_local_favorites(
        ACCOUNT_ID,
        [
            LocalFavoriteItem(
                content_type=FavoriteContentType.CARD,
                content_id=CARD_ID,
            ),
            LocalFavoriteItem(
                content_type=FavoriteContentType.CARD,
                content_id=CARD_ID_2,
            ),
        ],
    )

    assert len(merged) == 2
    content_ids = {favorite.content_id for favorite in merged}
    assert content_ids == {CARD_ID, CARD_ID_2}
    favorites_table.insert.assert_called_once()
    mock_adjust_save_count.assert_called_once_with(CARD_ID_2, 1)


@patch("app.favorites.service._content_exists")
@patch("app.favorites.service.get_supabase_client")
def test_merge_local_favorites_skips_invalid_content_ids(
    mock_get_client: MagicMock,
    mock_content_exists: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock
    mock_content_exists.return_value = False

    favorites_table = MagicMock()
    client_mock.table.return_value = favorites_table
    list_execute = (
        favorites_table.select.return_value.eq.return_value.order.return_value.execute
    )
    list_execute.return_value.data = []

    merged = merge_local_favorites(
        ACCOUNT_ID,
        [
            LocalFavoriteItem(
                content_type=FavoriteContentType.CARD,
                content_id=CARD_ID,
            )
        ],
    )

    assert merged == []
    favorites_table.insert.assert_not_called()


@patch("app.favorites.service._adjust_card_save_count")
@patch("app.favorites.service._content_exists")
@patch("app.favorites.service.get_supabase_client")
def test_toggle_account_favorite_adds_and_removes(
    mock_get_client: MagicMock,
    mock_content_exists: MagicMock,
    mock_adjust_save_count: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock
    mock_content_exists.return_value = True

    favorites_table = MagicMock()
    client_mock.table.return_value = favorites_table

    favorites_query = favorites_table.select.return_value
    favorites_query = favorites_query.eq.return_value.eq.return_value.eq.return_value
    find_execute = favorites_query.limit.return_value.execute
    find_execute.side_effect = [
        MagicMock(data=[]),
        MagicMock(
            data=[
                {
                    "id": str(FAVORITE_ID),
                    "content_type": "card",
                    "content_id": str(CARD_ID),
                    "created_at": CREATED_AT.isoformat(),
                }
            ]
        ),
    ]

    favorites_table.insert.return_value.execute.return_value.data = [
        {
            "id": str(FAVORITE_ID),
            "content_type": "card",
            "content_id": str(CARD_ID),
            "created_at": CREATED_AT.isoformat(),
        }
    ]

    added = toggle_account_favorite(
        ACCOUNT_ID,
        FavoriteContentType.CARD,
        CARD_ID,
        favorited=True,
    )
    assert added.favorited is True
    mock_adjust_save_count.assert_called_once_with(CARD_ID, 1)

    removed = toggle_account_favorite(
        ACCOUNT_ID,
        FavoriteContentType.CARD,
        CARD_ID,
        favorited=False,
    )
    assert removed.favorited is False
    favorites_table.delete.return_value.eq.return_value.execute.assert_called_once()
    mock_adjust_save_count.assert_called_with(CARD_ID, -1)


@patch("app.accounts.service.merge_local_favorites")
@patch("app.accounts.service._insert_recovery_codes")
@patch("app.accounts.service._get_account_by_username")
@patch("app.accounts.service.get_supabase_client")
def test_signup_merges_local_favorites_into_response(
    mock_get_client: MagicMock,
    mock_get_account: MagicMock,
    mock_insert_codes: MagicMock,
    mock_merge: MagicMock,
) -> None:
    mock_get_account.return_value = None
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock
    client_mock.table.return_value.insert.return_value.execute.return_value.data = [
        {
            "id": str(ACCOUNT_ID),
            "username": "testuser",
            "theme_preference": "system",
            "layout_version": "classic",
            "created_at": CREATED_AT.isoformat(),
            "updated_at": CREATED_AT.isoformat(),
        }
    ]
    mock_merge.return_value = [SAMPLE_FAVORITE]

    response = client.post(
        "/v1/accounts",
        json={
            "username": "testuser",
            "password": "StrongPass123",
            "local_favorites": [
                {"content_type": "card", "content_id": str(CARD_ID)},
            ],
        },
    )

    assert response.status_code == 200
    body = response.json()["data"]
    assert len(body["favorites"]) == 1
    mock_merge.assert_called_once()
