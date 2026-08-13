from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from app.accounts.dependencies import (
    invalid_credentials,
    invalid_recovery_code,
    row_to_account_public,
)
from app.accounts.schemas import (
    AccountLoginRequest,
    AccountPublic,
    AccountRecoverRequest,
    AccountSessionResponse,
    AccountSignupRequest,
    AccountSignupResponse,
)
from app.accounts.security import (
    generate_recovery_codes,
    hash_password,
    hash_recovery_code,
    issue_account_access_token,
    normalize_username,
    verify_password,
    verify_recovery_code,
)
from app.auth.service import get_supabase_client
from app.core.errors import conflict, recovery_exhausted, validation_error
from app.favorites.service import merge_local_favorites


def _get_account_by_username(username: str) -> dict[str, object] | None:
    client = get_supabase_client()
    normalized = normalize_username(username)
    response = (
        client.table("accounts")
        .select(
            "id, username, password_hash, theme_preference, layout_version, "
            "created_at, updated_at"
        )
        .eq("username", normalized)
        .limit(1)
        .execute()
    )
    if not response.data:
        return None
    return response.data[0]


def _insert_recovery_codes(account_id: UUID, codes: list[str]) -> None:
    client = get_supabase_client()
    rows = [
        {
            "account_id": str(account_id),
            "code_hash": hash_recovery_code(code),
        }
        for code in codes
    ]
    client.table("recovery_codes").insert(rows).execute()


def _delete_recovery_codes(account_id: UUID) -> None:
    client = get_supabase_client()
    client.table("recovery_codes").delete().eq("account_id", str(account_id)).execute()


def _count_unused_recovery_codes(account_id: UUID) -> int:
    client = get_supabase_client()
    response = (
        client.table("recovery_codes")
        .select("id", count="exact")
        .eq("account_id", str(account_id))
        .is_("used_at", "null")
        .execute()
    )
    return int(response.count or 0)


def _load_recovery_code_rows(account_id: UUID) -> list[dict[str, object]]:
    client = get_supabase_client()
    response = (
        client.table("recovery_codes")
        .select("id, code_hash, used_at")
        .eq("account_id", str(account_id))
        .execute()
    )
    return response.data or []


def _burn_recovery_code(code_id: UUID) -> None:
    client = get_supabase_client()
    client.table("recovery_codes").update(
        {"used_at": datetime.now(UTC).isoformat()}
    ).eq("id", str(code_id)).execute()


def _update_account_password(account_id: UUID, password_hash: str) -> None:
    client = get_supabase_client()
    client.table("accounts").update(
        {
            "password_hash": password_hash,
            "updated_at": datetime.now(UTC).isoformat(),
        }
    ).eq("id", str(account_id)).execute()


def signup_account(payload: AccountSignupRequest) -> AccountSignupResponse:
    if _get_account_by_username(payload.username) is not None:
        raise conflict("That username is already taken.")

    password_hash = hash_password(payload.password)
    normalized_username = normalize_username(payload.username)
    client = get_supabase_client()
    response = (
        client.table("accounts")
        .insert(
            {
                "username": normalized_username,
                "password_hash": password_hash,
            }
        )
        .execute()
    )
    if not response.data:
        raise validation_error("Could not create that account.")

    account_row = response.data[0]
    account_id = UUID(str(account_row["id"]))
    recovery_codes = generate_recovery_codes()
    _insert_recovery_codes(account_id, recovery_codes)

    account = row_to_account_public(account_row)
    favorites = merge_local_favorites(account_id, payload.local_favorites)
    return AccountSignupResponse(
        account=account,
        access_token=issue_account_access_token(account_id),
        recovery_codes=recovery_codes,
        favorites=favorites,
    )


def login_account(payload: AccountLoginRequest) -> AccountSessionResponse:
    account_row = _get_account_by_username(payload.username)
    if account_row is None or not verify_password(
        str(account_row["password_hash"]),
        payload.password,
    ):
        raise invalid_credentials()

    account = row_to_account_public(account_row)
    account_id = UUID(str(account_row["id"]))
    favorites = merge_local_favorites(account_id, payload.local_favorites)
    return AccountSessionResponse(
        account=account,
        access_token=issue_account_access_token(account_id),
        favorites=favorites,
    )


def recover_account(payload: AccountRecoverRequest) -> AccountSessionResponse:
    account_row = _get_account_by_username(payload.username)
    if account_row is None:
        raise invalid_credentials()

    account_id = UUID(str(account_row["id"]))
    if _count_unused_recovery_codes(account_id) == 0:
        raise recovery_exhausted()

    matched_code_id: UUID | None = None
    for row in _load_recovery_code_rows(account_id):
        if row.get("used_at") is not None:
            continue
        if verify_recovery_code(str(row["code_hash"]), payload.recovery_code):
            matched_code_id = UUID(str(row["id"]))
            break

    if matched_code_id is None:
        raise invalid_recovery_code()

    _burn_recovery_code(matched_code_id)
    _update_account_password(account_id, hash_password(payload.new_password))

    refreshed = _get_account_by_username(payload.username)
    if refreshed is None:
        raise validation_error("Could not recover that account.")

    account = row_to_account_public(refreshed)
    return AccountSessionResponse(
        account=account,
        access_token=issue_account_access_token(account_id),
    )


def regenerate_recovery_codes(account_id: UUID) -> list[str]:
    _delete_recovery_codes(account_id)
    recovery_codes = generate_recovery_codes()
    _insert_recovery_codes(account_id, recovery_codes)
    return recovery_codes


def _get_account_by_id(account_id: UUID) -> dict[str, object] | None:
    client = get_supabase_client()
    response = (
        client.table("accounts")
        .select(
            "id, username, theme_preference, layout_version, created_at, updated_at"
        )
        .eq("id", str(account_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        return None
    return response.data[0]


def get_account_profile(account_id: UUID) -> AccountPublic:
    account_row = _get_account_by_id(account_id)
    if account_row is None:
        raise validation_error("Account not found.")
    return row_to_account_public(account_row)


def update_account_preferences(
    account_id: UUID,
    *,
    theme_preference: str | None = None,
    layout_version: str | None = None,
) -> AccountPublic:
    updates: dict[str, str] = {
        "updated_at": datetime.now(UTC).isoformat(),
    }
    if theme_preference is not None:
        updates["theme_preference"] = theme_preference
    if layout_version is not None:
        updates["layout_version"] = layout_version

    client = get_supabase_client()
    response = (
        client.table("accounts").update(updates).eq("id", str(account_id)).execute()
    )
    if not response.data:
        raise validation_error("Could not update account preferences.")

    return row_to_account_public(response.data[0])
