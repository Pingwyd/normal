from __future__ import annotations

import re
from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.favorites.schemas import FavoriteItem, LocalFavoriteItem


class AccountThemePreference(StrEnum):
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


class AccountLayoutVersion(StrEnum):
    CLASSIC = "classic"
    NEW = "new"


class AccountSignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    local_favorites: list[LocalFavoriteItem] = Field(default_factory=list)

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        if not re.fullmatch(r"[A-Za-z0-9_]+", value):
            msg = "Username may only contain letters, numbers, and underscores."
            raise ValueError(msg)
        return value


class AccountLoginRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=1, max_length=128)
    local_favorites: list[LocalFavoriteItem] = Field(default_factory=list)


class AccountRecoverRequest(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    recovery_code: str = Field(min_length=8, max_length=64)
    new_password: str = Field(min_length=8, max_length=128)


class AccountPublic(BaseModel):
    id: UUID
    username: str
    theme_preference: AccountThemePreference
    layout_version: AccountLayoutVersion
    created_at: datetime
    updated_at: datetime


class AccountSignupResponse(BaseModel):
    account: AccountPublic
    access_token: str
    token_type: str = "bearer"
    recovery_codes: list[str]
    favorites: list[FavoriteItem] = Field(default_factory=list)


class AccountSessionResponse(BaseModel):
    account: AccountPublic
    access_token: str
    token_type: str = "bearer"
    favorites: list[FavoriteItem] = Field(default_factory=list)


class AccountRecoveryCodesResponse(BaseModel):
    recovery_codes: list[str]
