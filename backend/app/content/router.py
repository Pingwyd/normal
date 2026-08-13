from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request

from app.content.likes_dependencies import LikeContext, get_like_context
from app.content.likes_service import get_card_like_status, toggle_card_like
from app.content.schemas import ListCardsParams
from app.content.service import get_published_card_by_slug, list_published_cards
from app.core.rate_limit import enforce_rate_limit
from app.core.responses import success_envelope

router = APIRouter(prefix="/v1", tags=["content"])

LIKE_TOGGLE_LIMIT = 60
LIKE_TOGGLE_WINDOW_SECONDS = 60.0


@router.get("/cards")
async def list_cards(
    q: Annotated[str | None, Query()] = None,
    category: Annotated[str | None, Query()] = None,
    tags: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    after: Annotated[str | None, Query()] = None,
) -> dict:
    tag_names = (
        [name.strip() for name in tags.split(",") if name.strip()] if tags else []
    )
    params = ListCardsParams(
        q=q,
        category=category,
        tag_names=tag_names,
        limit=limit,
        after=after,
    )
    cards, meta = list_published_cards(params)
    return success_envelope(
        [card.model_dump(mode="json") for card in cards],
        meta=meta,
    )


@router.get("/cards/{slug}")
async def get_card_detail(slug: str) -> dict:
    card = get_published_card_by_slug(slug)
    return success_envelope(card.model_dump(mode="json"))


@router.get("/cards/{card_id}/like")
async def get_card_like_status_route(
    card_id: UUID,
    context: Annotated[LikeContext, Depends(get_like_context)],
) -> dict:
    result = get_card_like_status(card_id, context)
    return success_envelope(result.model_dump(mode="json"))


@router.post("/cards/{card_id}/like")
async def toggle_card_like_route(
    card_id: UUID,
    request: Request,
    context: Annotated[LikeContext, Depends(get_like_context)],
) -> dict:
    enforce_rate_limit(
        request,
        scope="cards:like",
        max_requests=LIKE_TOGGLE_LIMIT,
        window_seconds=LIKE_TOGGLE_WINDOW_SECONDS,
    )
    result = toggle_card_like(card_id, context)
    return success_envelope(result.model_dump(mode="json"))
