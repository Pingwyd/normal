from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends

from app.auth.dependencies import require_role
from app.auth.models import AdminContext, AdminRole
from app.core.responses import success_envelope
from app.research.admin_schemas import (
    CreateResearchJobRequest,
    SaveProviderCredentialRequest,
)
from app.research.admin_service import (
    create_draft_from_job,
    create_research_job,
    delete_provider_credential,
    execute_research_job,
    get_research_job,
    list_provider_options,
    save_provider_credential,
)
from app.research.providers import ResearchProvider

router = APIRouter(prefix="/v1/admin/research", tags=["research-admin"])
require_founder = require_role(AdminRole.FOUNDER)


@router.get("/providers")
async def list_research_providers_route(
    admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    providers = list_provider_options(admin)
    return success_envelope(providers)


@router.put("/providers/{provider}/credentials")
async def save_provider_credential_route(
    provider: ResearchProvider,
    payload: SaveProviderCredentialRequest,
    admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    saved = save_provider_credential(admin, provider, payload.api_key)
    return success_envelope(saved)


@router.delete("/providers/{provider}/credentials")
async def delete_provider_credential_route(
    provider: ResearchProvider,
    admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    delete_provider_credential(admin, provider)
    return success_envelope({"deleted": True, "provider": provider.value})


@router.post("/jobs")
async def create_research_job_route(
    payload: CreateResearchJobRequest,
    background_tasks: BackgroundTasks,
    admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    job = create_research_job(admin, payload.question, payload.provider)
    background_tasks.add_task(
        execute_research_job,
        UUID(job["id"]),
        admin.admin_id,
    )
    return success_envelope(job)


@router.get("/jobs/{job_id}")
async def get_research_job_route(
    job_id: UUID,
    admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    job = get_research_job(admin, job_id)
    return success_envelope(job)


@router.post("/jobs/{job_id}/create-draft")
async def create_draft_from_research_job_route(
    job_id: UUID,
    admin: Annotated[AdminContext, Depends(require_founder)],
) -> dict:
    card = create_draft_from_job(admin, job_id)
    return success_envelope(card.model_dump(mode="json"))
