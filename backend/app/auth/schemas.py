from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.auth.models import AdminRole


class AdminUserCreate(BaseModel):
    auth_id: UUID
    role: AdminRole
    display_name: str = Field(min_length=1)


class AdminUserUpdate(BaseModel):
    role: AdminRole | None = None
    display_name: str | None = Field(default=None, min_length=1)


class AdminUserResponse(BaseModel):
    id: UUID
    auth_id: UUID
    role: AdminRole
    display_name: str
    created_at: datetime
    updated_at: datetime
