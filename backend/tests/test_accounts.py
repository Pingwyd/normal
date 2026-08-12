from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest
from fastapi.testclient import TestClient

from app.accounts.schemas import (
    AccountLayoutVersion,
    AccountLoginRequest,
    AccountPublic,
    AccountRecoverRequest,
    AccountSessionResponse,
    AccountSignupRequest,
    AccountSignupResponse,
    AccountThemePreference,
)
from app.accounts.security import (
    generate_recovery_codes,
    hash_password,
    hash_recovery_code,
    issue_account_access_token,
    normalize_recovery_code,
    verify_password,
    verify_recovery_code,
)
from app.accounts.service import login_account, recover_account, signup_account
from app.core.errors import ApiError
from app.main import app

client = TestClient(app)

ACCOUNT_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
CREATED_AT = datetime(2026, 8, 12, 12, 0, tzinfo=UTC)
UPDATED_AT = CREATED_AT

SAMPLE_ACCOUNT = AccountPublic(
    id=ACCOUNT_ID,
    username="testuser",
    theme_preference=AccountThemePreference.SYSTEM,
    layout_version=AccountLayoutVersion.CLASSIC,
    created_at=CREATED_AT,
    updated_at=UPDATED_AT,
)

SAMPLE_CODES = generate_recovery_codes()


def test_generate_recovery_codes_returns_eight_unique_codes() -> None:
    codes = generate_recovery_codes()
    assert len(codes) == 8
    assert len(set(codes)) == 8
    for code in codes:
        assert normalize_recovery_code(code)


def test_password_hash_and_verify_round_trip() -> None:
    password_hash = hash_password("StrongPass123")
    assert verify_password(password_hash, "StrongPass123") is True
    assert verify_password(password_hash, "WrongPass123") is False


def test_recovery_code_hash_and_verify_round_trip() -> None:
    code = "ABCD-EFGH-IJKL-MNOP"
    code_hash = hash_recovery_code(code)
    assert verify_recovery_code(code_hash, code) is True
    assert verify_recovery_code(code_hash, "WXYZ-EFGH-IJKL-MNOP") is False


@patch("app.accounts.router.signup_account")
def test_signup_returns_eight_recovery_codes_once(mock_signup: MagicMock) -> None:
    mock_signup.return_value = AccountSignupResponse(
        account=SAMPLE_ACCOUNT,
        access_token="token",
        recovery_codes=SAMPLE_CODES,
        favorites=[],
    )

    response = client.post(
        "/v1/accounts",
        json={"username": "testuser", "password": "StrongPass123"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert len(body["data"]["recovery_codes"]) == 8
    assert body["data"]["account"]["username"] == "testuser"
    assert body["data"]["access_token"] == "token"


@patch("app.accounts.router.login_account")
def test_login_succeeds_with_valid_credentials(mock_login: MagicMock) -> None:
    mock_login.return_value = AccountSessionResponse(
        account=SAMPLE_ACCOUNT,
        access_token="token",
        favorites=[],
    )

    response = client.post(
        "/v1/accounts/login",
        json={"username": "testuser", "password": "StrongPass123"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["access_token"] == "token"


@patch("app.accounts.router.login_account")
def test_login_fails_with_invalid_credentials(mock_login: MagicMock) -> None:
    mock_login.side_effect = ApiError(
        code="VALIDATION_ERROR",
        message="Incorrect username or password.",
        status_code=422,
    )

    response = client.post(
        "/v1/accounts/login",
        json={"username": "testuser", "password": "wrong"},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


@patch("app.accounts.service.merge_local_favorites")
@patch("app.accounts.service.get_supabase_client")
def test_signup_service_stores_hashed_password_and_eight_codes(
    mock_get_client: MagicMock,
    mock_merge: MagicMock,
) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock

    accounts_table = MagicMock()
    recovery_table = MagicMock()
    client_mock.table.side_effect = lambda name: {
        "accounts": accounts_table,
        "recovery_codes": recovery_table,
    }[name]

    select_execute = (
        accounts_table.select.return_value.eq.return_value.limit.return_value.execute
    )
    select_execute.return_value.data = []
    accounts_table.insert.return_value.execute.return_value.data = [
        {
            "id": str(ACCOUNT_ID),
            "username": "testuser",
            "theme_preference": "system",
            "layout_version": "classic",
            "created_at": CREATED_AT.isoformat(),
            "updated_at": UPDATED_AT.isoformat(),
        }
    ]

    mock_merge.return_value = []

    result = signup_account(
        AccountSignupRequest(username="TestUser", password="StrongPass123")
    )

    assert len(result.recovery_codes) == 8
    insert_call = recovery_table.insert.call_args.args[0]
    assert len(insert_call) == 8
    assert all("code_hash" in row for row in insert_call)
    assert "password_hash" in accounts_table.insert.call_args.args[0]


@patch("app.accounts.service.merge_local_favorites")
@patch("app.accounts.service.issue_account_access_token")
@patch("app.accounts.service._get_account_by_username")
def test_login_service_verifies_password(
    mock_get_account: MagicMock,
    mock_issue_token: MagicMock,
    mock_merge: MagicMock,
) -> None:
    password_hash = hash_password("StrongPass123")
    mock_get_account.return_value = {
        "id": str(ACCOUNT_ID),
        "username": "testuser",
        "password_hash": password_hash,
        "theme_preference": "system",
        "layout_version": "classic",
        "created_at": CREATED_AT.isoformat(),
        "updated_at": UPDATED_AT.isoformat(),
    }
    mock_issue_token.return_value = "token"
    mock_merge.return_value = []

    result = login_account(
        AccountLoginRequest(username="testuser", password="StrongPass123")
    )

    assert result.access_token == "token"
    assert result.account.username == "testuser"


@patch("app.accounts.service.issue_account_access_token")
@patch("app.accounts.service._update_account_password")
@patch("app.accounts.service._burn_recovery_code")
@patch("app.accounts.service._load_recovery_code_rows")
@patch("app.accounts.service._count_unused_recovery_codes")
@patch("app.accounts.service._get_account_by_username")
def test_recover_service_burns_matching_code(
    mock_get_account: MagicMock,
    mock_count_unused: MagicMock,
    mock_load_codes: MagicMock,
    mock_burn_code: MagicMock,
    mock_update_password: MagicMock,
    mock_issue_token: MagicMock,
) -> None:
    code = generate_recovery_codes()[0]
    code_id = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
    account_row = {
        "id": str(ACCOUNT_ID),
        "username": "testuser",
        "password_hash": hash_password("OldPass123"),
        "theme_preference": "system",
        "layout_version": "classic",
        "created_at": CREATED_AT.isoformat(),
        "updated_at": UPDATED_AT.isoformat(),
    }

    mock_get_account.side_effect = [account_row, account_row]
    mock_count_unused.return_value = 3
    mock_load_codes.return_value = [
        {
            "id": str(code_id),
            "code_hash": hash_recovery_code(code),
            "used_at": None,
        }
    ]
    mock_issue_token.return_value = "new-token"

    result = recover_account(
        AccountRecoverRequest(
            username="testuser",
            recovery_code=code,
            new_password="NewPass12345",
        )
    )

    mock_burn_code.assert_called_once_with(code_id)
    mock_update_password.assert_called_once()
    assert result.access_token == "new-token"


@patch("app.accounts.service._load_recovery_code_rows")
@patch("app.accounts.service._count_unused_recovery_codes")
@patch("app.accounts.service._get_account_by_username")
def test_recover_service_rejects_used_code(
    mock_get_account: MagicMock,
    mock_count_unused: MagicMock,
    mock_load_codes: MagicMock,
) -> None:
    mock_get_account.return_value = {
        "id": str(ACCOUNT_ID),
        "username": "testuser",
        "password_hash": hash_password("OldPass123"),
        "theme_preference": "system",
        "layout_version": "classic",
        "created_at": CREATED_AT.isoformat(),
        "updated_at": UPDATED_AT.isoformat(),
    }
    mock_count_unused.return_value = 2
    mock_load_codes.return_value = [
        {
            "id": str(UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")),
            "code_hash": hash_recovery_code(generate_recovery_codes()[0]),
            "used_at": CREATED_AT.isoformat(),
        }
    ]

    with pytest.raises(ApiError) as exc_info:
        recover_account(
            AccountRecoverRequest(
                username="testuser",
                recovery_code=generate_recovery_codes()[0],
                new_password="NewPass12345",
            )
        )

    assert exc_info.value.code == "VALIDATION_ERROR"


@patch("app.accounts.service._count_unused_recovery_codes")
@patch("app.accounts.service._get_account_by_username")
def test_recover_service_returns_recovery_exhausted(
    mock_get_account: MagicMock,
    mock_count_unused: MagicMock,
) -> None:
    mock_get_account.return_value = {
        "id": str(ACCOUNT_ID),
        "username": "testuser",
        "password_hash": hash_password("OldPass123"),
        "theme_preference": "system",
        "layout_version": "classic",
        "created_at": CREATED_AT.isoformat(),
        "updated_at": UPDATED_AT.isoformat(),
    }
    mock_count_unused.return_value = 0

    with pytest.raises(ApiError) as exc_info:
        recover_account(
            AccountRecoverRequest(
                username="testuser",
                recovery_code="ABCD-EFGH-IJKL-MNOP",
                new_password="NewPass12345",
            )
        )

    assert exc_info.value.code == "RECOVERY_EXHAUSTED"


def test_regenerate_recovery_codes_requires_auth() -> None:
    response = client.post("/v1/accounts/recovery-codes/regenerate")
    assert response.status_code == 401


@patch("app.accounts.router.regenerate_recovery_codes")
@patch("app.accounts.dependencies.get_supabase_client")
def test_regenerate_recovery_codes_returns_eight_codes(
    mock_get_client: MagicMock,
    mock_regenerate: MagicMock,
) -> None:
    table_mock = mock_get_client.return_value.table.return_value
    select_execute = (
        table_mock.select.return_value.eq.return_value.limit.return_value.execute
    )
    select_execute.return_value.data = [{"id": str(ACCOUNT_ID), "username": "testuser"}]
    mock_regenerate.return_value = SAMPLE_CODES
    token = issue_account_access_token(ACCOUNT_ID)

    response = client.post(
        "/v1/accounts/recovery-codes/regenerate",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert len(response.json()["data"]["recovery_codes"]) == 8
