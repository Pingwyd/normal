from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.accounts.dependencies import AccountContext
from app.core.errors import unauthorized
from app.core.responses import success_envelope
from app.favorites.dependencies import get_optional_account
from app.favorites.schemas import FavoriteContentType, FavoriteToggleRequest
from app.favorites.service import list_account_favorites, toggle_account_favorite

router = APIRouter(prefix="/v1/favorites", tags=["favorites"])


@router.get("")
async def list_favorites_route(
    account: Annotated[AccountContext | None, Depends(get_optional_account)],
    content_type: Annotated[FavoriteContentType | None, Query()] = None,
) -> dict:
    if account is None:
        return success_envelope([])
    favorites = list_account_favorites(
        account.account_id,
        content_type=content_type,
    )
    return success_envelope(
        [favorite.model_dump(mode="json") for favorite in favorites]
    )


@router.post("")
async def toggle_favorite_route(
    payload: FavoriteToggleRequest,
    account: Annotated[AccountContext | None, Depends(get_optional_account)],
) -> dict:
    if account is None:
        raise unauthorized(
            "Sign in to sync favorites across devices, or save them locally."
        )

    result = toggle_account_favorite(
        account.account_id,
        payload.content_type,
        payload.content_id,
        favorited=payload.favorited,
    )
    return success_envelope(result.model_dump(mode="json"))
