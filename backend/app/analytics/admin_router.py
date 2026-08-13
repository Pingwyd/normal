from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.analytics.service import get_admin_analytics
from app.auth.dependencies import require_admin
from app.auth.models import AdminContext
from app.core.responses import success_envelope

router = APIRouter(prefix="/v1/admin", tags=["admin-analytics"])


@router.get("/analytics")
async def get_analytics_route(
    _admin: Annotated[AdminContext, Depends(require_admin)],
    days: Annotated[int | None, Query(ge=7, le=365)] = None,
    top_limit: Annotated[int | None, Query(ge=1, le=50)] = None,
) -> dict:
    del _admin
    analytics = get_admin_analytics(days=days, top_limit=top_limit)
    return success_envelope(analytics.model_dump(mode="json"))
