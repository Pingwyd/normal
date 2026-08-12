import jwt
from jwt import PyJWKClient

from app.core.config import get_settings
from app.core.errors import unauthorized

_jwk_client: PyJWKClient | None = None


def _get_jwk_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        settings = get_settings()
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        _jwk_client = PyJWKClient(jwks_url)
    return _jwk_client


def reset_jwk_client() -> None:
    global _jwk_client
    _jwk_client = None


def verify_supabase_jwt(token: str) -> dict[str, object]:
    settings = get_settings()
    try:
        signing_key = _get_jwk_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience=settings.supabase_jwt_aud,
            issuer=f"{settings.supabase_url}/auth/v1",
            leeway=30,
        )
    except jwt.PyJWTError as exc:
        raise unauthorized("Invalid or expired authentication token.") from exc

    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise unauthorized("Invalid or expired authentication token.")

    return payload
