from typing import Annotated

from fastapi import APIRouter, Query

from app.core.responses import success_envelope
from app.reflections.schemas import ListReflectionsParams, ReflectionFormat
from app.reflections.service import (
    get_published_reflection_by_slug,
    list_published_reflections,
)

router = APIRouter(prefix="/v1", tags=["reflections"])


@router.get("/reflections")
async def list_reflections_route(
    tag: Annotated[str | None, Query()] = None,
    format_filter: Annotated[ReflectionFormat | None, Query(alias="format")] = None,
    limit: Annotated[int, Query(ge=1, le=50)] = 20,
    after: Annotated[str | None, Query()] = None,
) -> dict:
    params = ListReflectionsParams(
        tag_name=tag,
        format=format_filter,
        limit=limit,
        after=after,
    )
    reflections, meta = list_published_reflections(params)
    return success_envelope(
        [item.model_dump(mode="json") for item in reflections],
        meta=meta,
    )


@router.get("/reflections/{slug}")
async def get_reflection_detail_route(slug: str) -> dict:
    reflection = get_published_reflection_by_slug(slug)
    return success_envelope(reflection.model_dump(mode="json"))
