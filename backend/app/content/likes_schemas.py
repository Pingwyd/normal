from pydantic import BaseModel


class CardLikeToggleResponse(BaseModel):
    liked: bool
    like_count: int
