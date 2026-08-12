from __future__ import annotations

from typing import Annotated

from fastapi import Header

from app.accounts.dependencies import AccountContext, get_current_account
from app.core.errors import ApiError, unauthorized


async def get_optional_account(
    authorization: Annotated[str | None, Header()] = None,
) -> AccountContext | None:
    if not authorization:
        return None

    try:
        return await get_current_account(authorization=authorization)
    except ApiError as exc:
        if exc.code == "UNAUTHORIZED":
            raise unauthorized("Invalid or expired authentication token.") from exc
        raise
