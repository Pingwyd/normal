import pytest

from app.auth.jwt import reset_jwk_client
from app.auth.service import reset_supabase_client
from app.core.config import reset_settings


@pytest.fixture(autouse=True)
def configure_test_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SUPABASE_URL", "https://example.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
    monkeypatch.setenv("SUPABASE_JWT_AUD", "authenticated")
    reset_settings()
    reset_jwk_client()
    reset_supabase_client()
    yield
    reset_settings()
    reset_jwk_client()
    reset_supabase_client()
