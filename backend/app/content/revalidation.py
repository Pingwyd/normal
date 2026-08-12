import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def trigger_card_revalidation(slug: str) -> None:
    settings = get_settings()
    if not settings.frontend_revalidate_url or not settings.revalidation_secret:
        logger.warning(
            "cache_revalidation_skipped",
            extra={"slug": slug, "reason": "missing_env"},
        )
        return

    try:
        response = httpx.post(
            settings.frontend_revalidate_url,
            headers={"Authorization": f"Bearer {settings.revalidation_secret}"},
            json={"paths": [f"/cards/{slug}"]},
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        logger.exception(
            "cache_revalidation_failed",
            extra={"slug": slug},
        )
