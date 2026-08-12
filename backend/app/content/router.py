from typing import Annotated

from fastapi import APIRouter, Query

from app.content.schemas import ListCardsParams
from app.content.service import get_published_card_by_slug, list_published_cards
from app.core.responses import success_envelope

router = APIRouter(prefix="/v1", tags=["content"])


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
