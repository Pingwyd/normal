from datetime import date
from uuid import UUID

from pydantic import BaseModel, Field


class TopSavedCardItem(BaseModel):
    card_id: UUID
    question: str
    slug: str
    save_count: int = Field(ge=0)


class TopLikedCardItem(BaseModel):
    card_id: UUID
    question: str
    slug: str
    like_count: int = Field(ge=0)


class SubmissionVolumeBucket(BaseModel):
    date: date
    count: int = Field(ge=0)


class SubmissionVolume(BaseModel):
    window_days: int = Field(ge=7, le=365)
    total_in_window: int = Field(ge=0)
    buckets: list[SubmissionVolumeBucket] = Field(default_factory=list)


class SubscriberCounts(BaseModel):
    active: int = Field(ge=0)
    total: int = Field(ge=0)


class AdminAnalyticsResponse(BaseModel):
    top_saved_cards: list[TopSavedCardItem] = Field(default_factory=list)
    top_liked_cards: list[TopLikedCardItem] = Field(default_factory=list)
    submission_volume: SubmissionVolume
    newsletter_subscribers: SubscriberCounts
    push_subscribers: SubscriberCounts
