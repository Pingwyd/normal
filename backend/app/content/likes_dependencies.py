from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Header

from app.accounts.dependencies import AccountContext, get_current_account
from app.core.errors import ApiError, unauthorized, validation_error

_DEVICE_ID_MIN_LENGTH = 8
_DEVICE_ID_MAX_LENGTH = 128


@dataclass(frozen=True)
class LikeContext:
    account_id: UUID | None
    device_identifier: str | None


async def get_like_context(
    authorization: Annotated[str | None, Header()] = None,
    x_device_id: Annotated[str | None, Header(alias="X-Device-Id")] = None,
) -> LikeContext:
    if authorization:
        try:
            account: AccountContext = await get_current_account(
                authorization=authorization
            )
        except ApiError as exc:
            if exc.code == "UNAUTHORIZED":
                raise unauthorized("Invalid or expired authentication token.") from exc
            raise
        return LikeContext(account_id=account.account_id, device_identifier=None)

    device_identifier = (x_device_id or "").strip()
    if len(device_identifier) < _DEVICE_ID_MIN_LENGTH:
        raise validation_error("X-Device-Id header is required for anonymous likes.")
    if len(device_identifier) > _DEVICE_ID_MAX_LENGTH:
        raise validation_error("Device identifier is too long.")

    return LikeContext(account_id=None, device_identifier=device_identifier)
