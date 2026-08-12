import os
from dataclasses import dataclass

_DEFAULT_CORS_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)


def _parse_cors_origins(raw_value: str | None = None) -> tuple[str, ...]:
    cors_origins_raw = raw_value or os.getenv(
        "CORS_ORIGINS",
        ",".join(_DEFAULT_CORS_ORIGINS),
    )
    cors_origins = tuple(
        origin.strip().rstrip("/")
        for origin in cors_origins_raw.split(",")
        if origin.strip()
    )
    if not cors_origins:
        msg = "CORS_ORIGINS must include at least one origin"
        raise RuntimeError(msg)
    return cors_origins


def get_cors_origins() -> tuple[str, ...]:
    return _parse_cors_origins()


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_aud: str
    account_jwt_secret: str
    account_jwt_ttl_seconds: int
    cors_origins: tuple[str, ...]
    frontend_revalidate_url: str | None
    revalidation_secret: str | None

    @classmethod
    def from_env(cls) -> "Settings":
        supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        supabase_jwt_aud = os.getenv("SUPABASE_JWT_AUD", "authenticated")
        account_jwt_secret = os.getenv("ACCOUNT_JWT_SECRET", "")
        account_jwt_ttl_seconds = int(
            os.getenv("ACCOUNT_JWT_TTL_SECONDS", str(60 * 60 * 24 * 30))
        )
        cors_origins = _parse_cors_origins()
        frontend_revalidate_url = os.getenv("FRONTEND_REVALIDATE_URL") or None
        revalidation_secret = os.getenv("REVALIDATION_SECRET") or None

        if not supabase_url or not supabase_service_role_key:
            msg = "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
            raise RuntimeError(msg)
        if not account_jwt_secret:
            msg = "ACCOUNT_JWT_SECRET must be set"
            raise RuntimeError(msg)

        return cls(
            supabase_url=supabase_url,
            supabase_service_role_key=supabase_service_role_key,
            supabase_jwt_aud=supabase_jwt_aud,
            account_jwt_secret=account_jwt_secret,
            account_jwt_ttl_seconds=account_jwt_ttl_seconds,
            cors_origins=cors_origins,
            frontend_revalidate_url=frontend_revalidate_url,
            revalidation_secret=revalidation_secret,
        )


_settings: Settings | None = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings.from_env()
    return _settings


def reset_settings() -> None:
    global _settings
    _settings = None
