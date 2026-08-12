from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel


class AdminRole(StrEnum):
    FOUNDER = "founder"
    CLINICAL_REVIEWER = "clinical_reviewer"


class AdminContext(BaseModel):
    auth_id: UUID
    admin_id: UUID
    role: AdminRole
    display_name: str
