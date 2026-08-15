from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import require_admin, require_role
from app.auth.models import AdminContext, AdminRole
from app.content.admin_schemas import AdminCardCreate, AdminCardUpdate, CardStatus
from app.content.admin_service import (
    create_admin_card,
    delete_admin_card,
    get_admin_card,
    list_admin_cards,
    list_cards_due_for_review,
    update_admin_card,
)
from app.content.affirmations_schemas import (
    AdminAffirmationCreate,
    AdminAffirmationUpdate,
)
from app.content.affirmations_service import (
    create_admin_affirmation,
    delete_admin_affirmation,
    get_admin_affirmation,
    list_admin_affirmations,
    update_admin_affirmation,
)
from app.content.daily_content_schemas import DailyContentStatus
from app.content.draft_import_schemas import CardDraftImport, CardDraftImportRequest
from app.content.draft_import_service import find_missing_tag_names, import_card_draft
from app.content.quotes_schemas import AdminQuoteCreate, AdminQuoteUpdate
from app.content.quotes_service import (
    create_admin_quote,
    delete_admin_quote,
    get_admin_quote,
    list_admin_quotes,
    update_admin_quote,
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
    list_categories,
    list_tags,
    update_category,
    update_tag,
)
from app.core.responses import success_envelope

router = APIRouter(prefix="/v1/admin", tags=["content-admin"])
require_founder = require_role(AdminRole.FOUNDER)


@router.get("/cards")
async def list_cards_route(
    _admin: Annotated[AdminContext, Depends(require_admin)],
    status: Annotated[CardStatus | None, Query()] = None,
) -> dict:
    cards = list_admin_cards(status=status)
    return success_envelope([card.model_dump(mode="json") for card in cards])


@router.get("/cards/due-for-review")
async def due_for_review_route(
    _admin: Annotated[AdminContext, Depends(require_admin)],
    before: Annotated[datetime | None, Query()] = None,
) -> dict:
    cards = list_cards_due_for_review(before=before)
    return success_envelope([card.model_dump(mode="json") for card in cards])


@router.get("/cards/{card_id}")
async def get_card_route(
    card_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    card = get_admin_card(card_id)
    return success_envelope(card.model_dump(mode="json"))


@router.post("/cards")
async def create_card_route(
    payload: AdminCardCreate,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    card = create_admin_card(admin, payload)
    return success_envelope(card.model_dump(mode="json"))


@router.post("/cards/import-draft/preview")
async def preview_card_draft_import_route(
    payload: CardDraftImport,
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    missing_tags = find_missing_tag_names(payload.suggested_tags)
    return success_envelope({"missing_tags": missing_tags})


@router.post("/cards/import-draft")
async def import_card_draft_route(
    payload: CardDraftImportRequest,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    card = import_card_draft(
        admin,
        payload,
        create_missing_tags=payload.create_missing_tags,
    )
    return success_envelope(card.model_dump(mode="json"))


@router.patch("/cards/{card_id}")
async def update_card_route(
    card_id: UUID,
    payload: AdminCardUpdate,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    card = update_admin_card(admin, card_id, payload)
    return success_envelope(card.model_dump(mode="json"))


@router.delete("/cards/{card_id}")
async def delete_card_route(
    card_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    delete_admin_card(card_id)
    return success_envelope({"deleted": True, "id": str(card_id)})


@router.get("/categories")
async def list_categories_route(
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    categories = list_categories()
    return success_envelope(
        [category.model_dump(mode="json") for category in categories]
    )


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


@router.get("/tags")
async def list_tags_route(
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    tags = list_tags()
    return success_envelope([tag.model_dump(mode="json") for tag in tags])


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


@router.get("/affirmations")
async def list_affirmations_admin_route(
    _admin: Annotated[AdminContext, Depends(require_admin)],
    status: Annotated[DailyContentStatus | None, Query()] = None,
) -> dict:
    affirmations = list_admin_affirmations(status=status)
    return success_envelope([item.model_dump(mode="json") for item in affirmations])


@router.get("/affirmations/{affirmation_id}")
async def get_affirmation_admin_route(
    affirmation_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    affirmation = get_admin_affirmation(affirmation_id)
    return success_envelope(affirmation.model_dump(mode="json"))


@router.post("/affirmations")
async def create_affirmation_admin_route(
    payload: AdminAffirmationCreate,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    affirmation = create_admin_affirmation(admin, payload)
    return success_envelope(affirmation.model_dump(mode="json"))


@router.patch("/affirmations/{affirmation_id}")
async def update_affirmation_admin_route(
    affirmation_id: UUID,
    payload: AdminAffirmationUpdate,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    affirmation = update_admin_affirmation(admin, affirmation_id, payload)
    return success_envelope(affirmation.model_dump(mode="json"))


@router.delete("/affirmations/{affirmation_id}")
async def delete_affirmation_admin_route(
    affirmation_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    delete_admin_affirmation(affirmation_id)
    return success_envelope({"deleted": True, "id": str(affirmation_id)})


@router.get("/quotes")
async def list_quotes_admin_route(
    _admin: Annotated[AdminContext, Depends(require_admin)],
    status: Annotated[DailyContentStatus | None, Query()] = None,
) -> dict:
    quotes = list_admin_quotes(status=status)
    return success_envelope([item.model_dump(mode="json") for item in quotes])


@router.get("/quotes/{quote_id}")
async def get_quote_admin_route(
    quote_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    quote = get_admin_quote(quote_id)
    return success_envelope(quote.model_dump(mode="json"))


@router.post("/quotes")
async def create_quote_admin_route(
    payload: AdminQuoteCreate,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    quote = create_admin_quote(admin, payload)
    return success_envelope(quote.model_dump(mode="json"))


@router.patch("/quotes/{quote_id}")
async def update_quote_admin_route(
    quote_id: UUID,
    payload: AdminQuoteUpdate,
    admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    quote = update_admin_quote(admin, quote_id, payload)
    return success_envelope(quote.model_dump(mode="json"))


@router.delete("/quotes/{quote_id}")
async def delete_quote_admin_route(
    quote_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    delete_admin_quote(quote_id)
    return success_envelope({"deleted": True, "id": str(quote_id)})
