from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header

from app.accounts.schemas import (
    AccountLayoutVersion,
    AccountPublic,
    AccountThemePreference,
)
from app.accounts.security import verify_account_access_token
from app.auth.service import get_supabase_client
from app.core.errors import unauthorized, validation_error


@dataclass(frozen=True)
class AccountContext:
    account_id: UUID
    username: str


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise unauthorized()

    scheme, _, credentials = authorization.partition(" ")
    if scheme.lower() != "bearer" or not credentials:
        raise unauthorized()

    return credentials.strip()


def row_to_account_public(row: dict[str, object]) -> AccountPublic:
    return AccountPublic(
        id=UUID(str(row["id"])),
        username=str(row["username"]),
        theme_preference=AccountThemePreference(str(row["theme_preference"])),
        layout_version=AccountLayoutVersion(str(row["layout_version"])),
        created_at=datetime.fromisoformat(
            str(row["created_at"]).replace("Z", "+00:00")
        ),
        updated_at=datetime.fromisoformat(
            str(row["updated_at"]).replace("Z", "+00:00")
        ),
    )


async def get_current_account(
    authorization: Annotated[str | None, Header()] = None,
) -> AccountContext:
    token = _extract_bearer_token(authorization)
    payload = verify_account_access_token(token)
    client = get_supabase_client()
    response = (
        client.table("accounts")
        .select("id, username")
        .eq("id", str(payload.account_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise unauthorized("Invalid or expired authentication token.")

    row = response.data[0]
    return AccountContext(
        account_id=UUID(str(row["id"])),
        username=str(row["username"]),
    )


async def require_account(
    account: Annotated[AccountContext, Depends(get_current_account)],
) -> AccountContext:
    return account


def invalid_credentials() -> Exception:
    return validation_error("Incorrect username or password.")


def invalid_recovery_code() -> Exception:
    return validation_error("That recovery code is invalid or has already been used.")
