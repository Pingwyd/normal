import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_aud: str
    frontend_revalidate_url: str | None
    revalidation_secret: str | None

    @classmethod
    def from_env(cls) -> "Settings":
        supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
        supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        supabase_jwt_aud = os.getenv("SUPABASE_JWT_AUD", "authenticated")
        frontend_revalidate_url = os.getenv("FRONTEND_REVALIDATE_URL") or None
        revalidation_secret = os.getenv("REVALIDATION_SECRET") or None

        if not supabase_url or not supabase_service_role_key:
            msg = "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
            raise RuntimeError(msg)

        return cls(
            supabase_url=supabase_url,
            supabase_service_role_key=supabase_service_role_key,
            supabase_jwt_aud=supabase_jwt_aud,
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
