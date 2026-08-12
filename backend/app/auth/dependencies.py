from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header

from app.auth.jwt import verify_supabase_jwt
from app.auth.models import AdminContext, AdminRole
from app.auth.service import get_admin_by_auth_id
from app.core.errors import forbidden, unauthorized


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise unauthorized()

    scheme, _, credentials = authorization.partition(" ")
    if scheme.lower() != "bearer" or not credentials:
        raise unauthorized()

    return credentials.strip()


async def get_current_admin(
    authorization: Annotated[str | None, Header()] = None,
) -> AdminContext:
    token = _extract_bearer_token(authorization)
    payload = verify_supabase_jwt(token)
    auth_id = UUID(str(payload["sub"]))
    return get_admin_by_auth_id(auth_id)


async def require_admin(
    admin: Annotated[AdminContext, Depends(get_current_admin)],
) -> AdminContext:
    return admin


def require_role(*roles: AdminRole):
    async def dependency(
        admin: Annotated[AdminContext, Depends(get_current_admin)],
    ) -> AdminContext:
        if admin.role not in roles:
            raise forbidden()
        return admin

    return dependency
