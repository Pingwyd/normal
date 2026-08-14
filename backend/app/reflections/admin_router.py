from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.auth.dependencies import require_role
from app.auth.models import AdminContext, AdminRole
from app.core.responses import success_envelope
from app.reflections.admin_schemas import (
    AdminReflectionCreate,
    AdminReflectionUpdate,
    ReflectionStatus,
)
from app.reflections.admin_service import (
    create_admin_reflection,
    get_admin_reflection,
    list_admin_reflections,
    update_admin_reflection,
)

router = APIRouter(prefix="/v1/admin", tags=["reflections-admin"])
require_founder = require_role(AdminRole.FOUNDER)


@router.get("/reflections")
async def list_reflections_admin_route(
    _admin: Annotated[AdminContext, Depends(require_founder)],
    status: Annotated[ReflectionStatus | None, Query()] = None,
) -> dict:
    reflections = list_admin_reflections(status=status)
    return success_envelope(
        [item.model_dump(mode="json") for item in reflections],
    )


@router.get("/reflections/{reflection_id}")
async def get_reflection_admin_route(
    reflection_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    reflection = get_admin_reflection(reflection_id)
    return success_envelope(reflection.model_dump(mode="json"))


@router.post("/reflections")
async def create_reflection_admin_route(
    payload: AdminReflectionCreate,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    reflection = create_admin_reflection(payload)
    return success_envelope(reflection.model_dump(mode="json"))


@router.patch("/reflections/{reflection_id}")
async def update_reflection_admin_route(
    reflection_id: UUID,
    payload: AdminReflectionUpdate,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    reflection = update_admin_reflection(reflection_id, payload)
    return success_envelope(reflection.model_dump(mode="json"))
