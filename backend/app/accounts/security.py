from __future__ import annotations

import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import get_settings
from app.core.errors import unauthorized

_password_hasher = PasswordHasher()
_RECOVERY_CODE_COUNT = 8
_RECOVERY_CODE_GROUPS = 4
_RECOVERY_CODE_GROUP_SIZE = 4


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def normalize_recovery_code(code: str) -> str:
    return re.sub(r"[\s-]+", "", code.strip()).upper()


def format_recovery_code(raw_code: str) -> str:
    normalized = normalize_recovery_code(raw_code)
    groups = [
        normalized[index : index + _RECOVERY_CODE_GROUP_SIZE]
        for index in range(
            0,
            len(normalized),
            _RECOVERY_CODE_GROUP_SIZE,
        )
    ]
    return "-".join(groups)


def generate_recovery_codes() -> list[str]:
    codes: list[str] = []
    for _ in range(_RECOVERY_CODE_COUNT):
        raw = secrets.token_hex(_RECOVERY_CODE_GROUP_SIZE * 2).upper()
        codes.append(format_recovery_code(raw))
    return codes


def hash_recovery_code(code: str) -> str:
    return _password_hasher.hash(normalize_recovery_code(code))


def verify_recovery_code(code_hash: str, code: str) -> bool:
    try:
        return _password_hasher.verify(code_hash, normalize_recovery_code(code))
    except VerifyMismatchError:
        return False


def normalize_username(username: str) -> str:
    return username.strip().lower()


def issue_account_access_token(account_id: UUID) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": str(account_id),
        "type": "account",
        "iss": "normal-api",
        "aud": "account",
        "iat": int(now.timestamp()),
        "exp": int(
            (now + timedelta(seconds=settings.account_jwt_ttl_seconds)).timestamp()
        ),
    }
    return jwt.encode(payload, settings.account_jwt_secret, algorithm="HS256")


@dataclass(frozen=True)
class AccountTokenPayload:
    account_id: UUID


def verify_account_access_token(token: str) -> AccountTokenPayload:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.account_jwt_secret,
            algorithms=["HS256"],
            audience="account",
            issuer="normal-api",
            leeway=30,
        )
    except jwt.PyJWTError as exc:
        raise unauthorized("Invalid or expired authentication token.") from exc

    if payload.get("type") != "account":
        raise unauthorized("Invalid or expired authentication token.")

    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise unauthorized("Invalid or expired authentication token.")

    return AccountTokenPayload(account_id=UUID(sub))
