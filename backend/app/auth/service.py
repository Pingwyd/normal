from uuid import UUID

from supabase import Client, create_client

from app.auth.models import AdminContext, AdminRole
from app.core.config import Settings, get_settings
from app.core.errors import unauthorized

_supabase_client: Client | None = None


def get_supabase_client(settings: Settings | None = None) -> Client:
    global _supabase_client
    if _supabase_client is None:
        resolved = settings or get_settings()
        _supabase_client = create_client(
            resolved.supabase_url,
            resolved.supabase_service_role_key,
        )
    return _supabase_client


def reset_supabase_client() -> None:
    global _supabase_client
    _supabase_client = None


def get_admin_by_auth_id(auth_id: UUID) -> AdminContext:
    response = (
        get_supabase_client()
        .table("admin_users")
        .select("id, auth_id, role, display_name")
        .eq("auth_id", str(auth_id))
        .limit(1)
        .execute()
    )

    if not response.data:
        raise unauthorized("Authentication is required.")

    row = response.data[0]
    return AdminContext(
        auth_id=UUID(row["auth_id"]),
        admin_id=UUID(row["id"]),
        role=AdminRole(row["role"]),
        display_name=row["display_name"],
    )
