from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.auth.admin_users_service import (
    create_admin_user,
    delete_admin_user,
    list_admin_users,
    update_admin_user,
)
from app.auth.dependencies import get_current_admin, require_role
from app.auth.models import AdminContext, AdminRole
from app.auth.schemas import AdminUserCreate, AdminUserUpdate
from app.core.responses import success_envelope

router = APIRouter(prefix="/v1/admin", tags=["admin-auth"])
require_founder = require_role(AdminRole.FOUNDER)


@router.get("/me")
async def admin_me(
    admin: Annotated[AdminContext, Depends(get_current_admin)],
) -> dict:
    return success_envelope(
        {
            "auth_id": str(admin.auth_id),
            "admin_id": str(admin.admin_id),
            "role": admin.role.value,
            "display_name": admin.display_name,
        }
    )


@router.post("/admin-users")
async def create_admin_user_route(
    payload: AdminUserCreate,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    admin_user = create_admin_user(payload)
    return success_envelope(admin_user.model_dump(mode="json"))


@router.get("/admin-users")
async def list_admin_users_route(
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    admin_users = list_admin_users()
    return success_envelope(
        [admin_user.model_dump(mode="json") for admin_user in admin_users]
    )


@router.patch("/admin-users/{admin_id}")
async def update_admin_user_route(
    admin_id: UUID,
    payload: AdminUserUpdate,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    admin_user = update_admin_user(admin_id, payload)
    return success_envelope(admin_user.model_dump(mode="json"))


@router.delete("/admin-users/{admin_id}")
async def delete_admin_user_route(
    admin_id: UUID,
    _admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    delete_admin_user(admin_id)
    return success_envelope({"deleted": True, "id": str(admin_id)})
