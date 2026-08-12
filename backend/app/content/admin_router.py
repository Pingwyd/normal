from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import require_admin, require_role
from app.auth.models import AdminContext, AdminRole
from app.content.admin_schemas import AdminCardCreate, AdminCardUpdate
from app.content.admin_service import (
    create_admin_card,
    list_cards_due_for_review,
    update_admin_card,
)
from app.content.reference_schemas import (
    CategoryCreate,
    CategoryUpdate,
    TagCreate,
    TagUpdate,
)
from app.content.reference_service import (
    create_category,
    create_tag,
    delete_category,
    delete_tag,
    update_category,
    update_tag,
)
from app.core.responses import success_envelope

router = APIRouter(prefix="/v1/admin", tags=["content-admin"])
require_founder = require_role(AdminRole.FOUNDER)


@router.post("/cards")
async def create_card_route(
    payload: AdminCardCreate,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    card = create_admin_card(admin, payload)
    return success_envelope(card.model_dump(mode="json"))


@router.patch("/cards/{card_id}")
async def update_card_route(
    card_id: UUID,
    payload: AdminCardUpdate,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    card = update_admin_card(admin, card_id, payload)
    return success_envelope(card.model_dump(mode="json"))


@router.get("/cards/due-for-review")
async def due_for_review_route(
    _admin: Annotated[AdminContext, Depends(require_admin)],
    before: Annotated[datetime | None, Query()] = None,
) -> dict:
    cards = list_cards_due_for_review(before=before)
    return success_envelope([card.model_dump(mode="json") for card in cards])


@router.post("/categories")
async def create_category_route(
    payload: CategoryCreate,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    category = create_category(payload)
    return success_envelope(category.model_dump(mode="json"))


@router.patch("/categories/{category_id}")
async def update_category_route(
    category_id: UUID,
    payload: CategoryUpdate,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    category = update_category(category_id, payload)
    return success_envelope(category.model_dump(mode="json"))


@router.delete("/categories/{category_id}")
async def delete_category_route(
    category_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    delete_category(category_id)
    return success_envelope({"deleted": True, "id": str(category_id)})


@router.post("/tags")
async def create_tag_route(
    payload: TagCreate,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    tag = create_tag(payload)
    return success_envelope(tag.model_dump(mode="json"))


@router.patch("/tags/{tag_id}")
async def update_tag_route(
    tag_id: UUID,
    payload: TagUpdate,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    tag = update_tag(tag_id, payload)
    return success_envelope(tag.model_dump(mode="json"))


@router.delete("/tags/{tag_id}")
async def delete_tag_route(
    tag_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    delete_tag(tag_id)
    return success_envelope({"deleted": True, "id": str(tag_id)})
