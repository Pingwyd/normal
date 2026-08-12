from datetime import datetime
from uuid import UUID

from app.auth.models import AdminRole
from app.auth.schemas import AdminUserCreate, AdminUserResponse, AdminUserUpdate
from app.auth.service import get_supabase_client
from app.core.errors import conflict, not_found


def _row_to_response(row: dict) -> AdminUserResponse:
    return AdminUserResponse(
        id=UUID(row["id"]),
        auth_id=UUID(row["auth_id"]),
        role=AdminRole(row["role"]),
        display_name=row["display_name"],
        created_at=datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")),
        updated_at=datetime.fromisoformat(row["updated_at"].replace("Z", "+00:00")),
    )


def list_admin_users() -> list[AdminUserResponse]:
    response = (
        get_supabase_client()
        .table("admin_users")
        .select("id, auth_id, role, display_name, created_at, updated_at")
        .order("created_at")
        .execute()
    )
    return [_row_to_response(row) for row in response.data]


def create_admin_user(payload: AdminUserCreate) -> AdminUserResponse:
    existing = (
        get_supabase_client()
        .table("admin_users")
        .select("id")
        .eq("auth_id", str(payload.auth_id))
        .limit(1)
        .execute()
    )
    if existing.data:
        raise conflict("An admin user with this auth identity already exists.")

    response = (
        get_supabase_client()
        .table("admin_users")
        .insert(
            {
                "auth_id": str(payload.auth_id),
                "role": payload.role.value,
                "display_name": payload.display_name,
            }
        )
        .select("id, auth_id, role, display_name, created_at, updated_at")
        .single()
        .execute()
    )
    return _row_to_response(response.data)


def update_admin_user(admin_id: UUID, payload: AdminUserUpdate) -> AdminUserResponse:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return get_admin_user(admin_id)

    if "role" in updates and updates["role"] is not None:
        updates["role"] = updates["role"].value

    response = (
        get_supabase_client()
        .table("admin_users")
        .update(updates)
        .eq("id", str(admin_id))
        .select("id, auth_id, role, display_name, created_at, updated_at")
        .execute()
    )

    if not response.data:
        raise not_found("That admin user could not be found.")

    return _row_to_response(response.data[0])


def get_admin_user(admin_id: UUID) -> AdminUserResponse:
    response = (
        get_supabase_client()
        .table("admin_users")
        .select("id, auth_id, role, display_name, created_at, updated_at")
        .eq("id", str(admin_id))
        .limit(1)
        .execute()
    )

    if not response.data:
        raise not_found("That admin user could not be found.")

    return _row_to_response(response.data[0])


def delete_admin_user(admin_id: UUID) -> None:
    response = (
        get_supabase_client()
        .table("admin_users")
        .delete()
        .eq("id", str(admin_id))
        .execute()
    )

    if not response.data:
        raise not_found("That admin user could not be found.")
