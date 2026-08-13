from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, model_validator


class PushSubscriptionKeys(BaseModel):
    p256dh: str = Field(min_length=1, max_length=512)
    auth: str = Field(min_length=1, max_length=512)


class PushSubscriptionRequest(BaseModel):
    endpoint: str = Field(min_length=8, max_length=2048)
    keys: PushSubscriptionKeys
    enabled: bool = True


class PushSubscriptionResponse(BaseModel):
    id: UUID
    endpoint: str
    enabled: bool
    account_id: UUID | None
    reassigned: bool


class NewsletterSubscribeRequest(BaseModel):
    email: EmailStr
    enabled: bool = True


class NewsletterSubscriptionResponse(BaseModel):
    email: str
    enabled: bool


class NotificationSendChannel(StrEnum):
    NEWSLETTER = "newsletter"
    PUSH = "push"


class NotificationTestSendRequest(BaseModel):
    channel: NotificationSendChannel
    email: EmailStr | None = None
    subscription_id: UUID | None = None

    @model_validator(mode="after")
    def validate_target(self) -> "NotificationTestSendRequest":
        if self.channel == NotificationSendChannel.NEWSLETTER and self.email is None:
            msg = "email is required when channel is newsletter."
            raise ValueError(msg)
        if (
            self.channel == NotificationSendChannel.PUSH
            and self.subscription_id is None
        ):
            msg = "subscription_id is required when channel is push."
            raise ValueError(msg)
        return self


class NotificationTestSendResponse(BaseModel):
    channel: NotificationSendChannel
    delivered: bool
    target: str
    provider_message_id: str | None = None
