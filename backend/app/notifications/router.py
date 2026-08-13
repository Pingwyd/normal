from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request

from app.accounts.dependencies import AccountContext
from app.core.rate_limit import enforce_rate_limit
from app.core.responses import success_envelope
from app.favorites.dependencies import get_optional_account
from app.notifications.newsletter_service import (
    subscribe_newsletter,
    unsubscribe_newsletter_by_token,
)
from app.notifications.push_service import upsert_push_subscription
from app.notifications.schemas import (
    NewsletterSubscribeRequest,
    PushSubscriptionRequest,
)

router = APIRouter(prefix="/v1", tags=["notifications"])

PUSH_SUBSCRIPTION_LIMIT = 20
PUSH_SUBSCRIPTION_WINDOW_SECONDS = 600.0
NEWSLETTER_LIMIT = 10
NEWSLETTER_WINDOW_SECONDS = 600.0


@router.post("/push-subscriptions")
async def upsert_push_subscription_route(
    payload: PushSubscriptionRequest,
    request: Request,
    account: Annotated[AccountContext | None, Depends(get_optional_account)],
) -> dict:
    enforce_rate_limit(
        request,
        scope="push-subscriptions:upsert",
        max_requests=PUSH_SUBSCRIPTION_LIMIT,
        window_seconds=PUSH_SUBSCRIPTION_WINDOW_SECONDS,
    )

    subscription = upsert_push_subscription(
        endpoint=payload.endpoint,
        keys=payload.keys.model_dump(),
        enabled=payload.enabled,
        account_id=account.account_id if account else None,
    )
    return success_envelope(subscription.model_dump(mode="json"))


@router.post("/newsletter")
async def subscribe_newsletter_route(
    payload: NewsletterSubscribeRequest,
    request: Request,
) -> dict:
    enforce_rate_limit(
        request,
        scope="newsletter:subscribe",
        max_requests=NEWSLETTER_LIMIT,
        window_seconds=NEWSLETTER_WINDOW_SECONDS,
    )

    subscription = subscribe_newsletter(
        email=str(payload.email),
        enabled=payload.enabled,
    )
    return success_envelope(subscription.model_dump(mode="json"))


@router.get("/newsletter/unsubscribe")
async def unsubscribe_newsletter_route(
    token: Annotated[str, Query(min_length=1, max_length=256)],
) -> dict:
    subscription = unsubscribe_newsletter_by_token(token)
    return success_envelope(subscription.model_dump(mode="json"))
