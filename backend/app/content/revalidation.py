import logging
from uuid import UUID

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def trigger_path_revalidation(paths: list[str]) -> None:
    settings = get_settings()
    if not settings.frontend_revalidate_url or not settings.revalidation_secret:
        logger.warning(
            "cache_revalidation_skipped",
            extra={"paths": paths, "reason": "missing_env"},
        )
        return

    try:
        response = httpx.post(
            settings.frontend_revalidate_url,
            headers={"Authorization": f"Bearer {settings.revalidation_secret}"},
            json={"paths": paths},
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPError:
        logger.exception(
            "cache_revalidation_failed",
            extra={"paths": paths},
        )


def trigger_card_revalidation(slug: str) -> None:
    trigger_path_revalidation([f"/cards/{slug}"])


def trigger_reflection_revalidation(slug: str) -> None:
    trigger_path_revalidation([f"/reflections/{slug}", "/reflections"])


def trigger_affirmation_revalidation(affirmation_id: UUID) -> None:
    trigger_path_revalidation(
        [
            f"/share/affirmations/{affirmation_id}",
            "/affirmations",
        ]
    )


def trigger_quote_revalidation(quote_id: UUID) -> None:
    trigger_path_revalidation(
        [
            f"/share/quotes/{quote_id}",
            "/quotes",
        ]
    )
