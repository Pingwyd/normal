from typing import Annotated

from fastapi import APIRouter, Depends

from app.auth.dependencies import require_admin
from app.auth.models import AdminContext
from app.core.responses import success_envelope
from app.notifications.delivery_service import (
    send_test_newsletter_email,
    send_test_push_notification,
)
from app.notifications.schemas import (
    NotificationSendChannel,
    NotificationTestSendRequest,
)

router = APIRouter(prefix="/v1/admin", tags=["admin-notifications"])


@router.post("/notifications/test-send")
async def test_send_notification_route(
    payload: NotificationTestSendRequest,
    _admin: Annotated[AdminContext, Depends(require_admin)],
) -> dict:
    del _admin

    if payload.channel == NotificationSendChannel.NEWSLETTER:
        result = send_test_newsletter_email(email=str(payload.email))
    else:
        assert payload.subscription_id is not None
        result = send_test_push_notification(
            subscription_id=payload.subscription_id,
        )

    return success_envelope(result.model_dump(mode="json"))
