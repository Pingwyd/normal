from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from app.auth.models import AdminContext
from app.auth.service import get_supabase_client
from app.content.admin_schemas import AdminCardResponse
from app.content.draft_import_schemas import CardDraftImport
from app.content.draft_import_service import import_card_draft
from app.content.reference_service import list_categories, list_tags
from app.core.errors import not_found, validation_error
from app.research.credentials_crypto import (
    decrypt_api_key,
    encrypt_api_key,
    key_hint_for,
)
from app.research.providers import PROVIDER_LABELS, ResearchProvider
from app.research.research_runner import run_provider_research

CREDENTIALS_SELECT = (
    "id, admin_user_id, provider, encrypted_api_key, key_hint, created_at, updated_at"
)
JOB_SELECT = (
    "id, question, status, provider, result, error_message, "
    "requested_by, created_at, completed_at"
)


def list_provider_options(admin: AdminContext) -> list[dict]:
    client = get_supabase_client()
    response = (
        client.table("research_provider_credentials")
        .select("provider, key_hint")
        .eq("admin_user_id", str(admin.admin_id))
        .execute()
    )
    configured = {row["provider"]: row["key_hint"] for row in response.data}

    return [
        {
            "provider": provider.value,
            "label": PROVIDER_LABELS[provider],
            "configured": provider.value in configured,
            "key_hint": configured.get(provider.value),
        }
        for provider in ResearchProvider
    ]


def save_provider_credential(
    admin: AdminContext,
    provider: ResearchProvider,
    api_key: str,
) -> dict:
    trimmed = api_key.strip()
    if len(trimmed) < 8:
        raise validation_error("API key looks too short to be valid.")

    encrypted = encrypt_api_key(trimmed)
    hint = key_hint_for(trimmed)
    now = datetime.now(UTC).isoformat()

    client = get_supabase_client()
    response = (
        client.table("research_provider_credentials")
        .upsert(
            {
                "admin_user_id": str(admin.admin_id),
                "provider": provider.value,
                "encrypted_api_key": encrypted,
                "key_hint": hint,
                "updated_at": now,
            },
            on_conflict="admin_user_id,provider",
        )
        .select("provider, key_hint")
        .execute()
    )
    if not response.data:
        msg = "Provider credential save did not return a row."
        raise RuntimeError(msg)

    row = response.data[0]
    return {
        "provider": row["provider"],
        "label": PROVIDER_LABELS[provider],
        "configured": True,
        "key_hint": row["key_hint"],
    }


def delete_provider_credential(
    admin: AdminContext,
    provider: ResearchProvider,
) -> None:
    client = get_supabase_client()
    response = (
        client.table("research_provider_credentials")
        .delete()
        .eq("admin_user_id", str(admin.admin_id))
        .eq("provider", provider.value)
        .execute()
    )
    if not response.data:
        raise not_found("No saved API key for that provider.")


def _get_provider_api_key(admin_id: UUID, provider: ResearchProvider) -> str:
    client = get_supabase_client()
    response = (
        client.table("research_provider_credentials")
        .select("encrypted_api_key")
        .eq("admin_user_id", str(admin_id))
        .eq("provider", provider.value)
        .limit(1)
        .execute()
    )
    if not response.data:
        raise validation_error(
            f"Save an API key for {PROVIDER_LABELS[provider]} before starting research."
        )
    return decrypt_api_key(response.data[0]["encrypted_api_key"])


def create_research_job(
    admin: AdminContext,
    question: str,
    provider: ResearchProvider,
) -> dict:
    trimmed = question.strip()
    if not trimmed:
        raise validation_error("Question is required.")

    _get_provider_api_key(admin.admin_id, provider)

    client = get_supabase_client()
    response = (
        client.table("research_jobs")
        .insert(
            {
                "question": trimmed,
                "status": "pending",
                "provider": provider.value,
                "requested_by": str(admin.admin_id),
            }
        )
        .select(JOB_SELECT)
        .execute()
    )
    if not response.data:
        msg = "Research job creation did not return a row."
        raise RuntimeError(msg)

    return _job_row_to_dict(response.data[0])


def get_research_job(admin: AdminContext, job_id: UUID) -> dict:
    client = get_supabase_client()
    response = (
        client.table("research_jobs")
        .select(JOB_SELECT)
        .eq("id", str(job_id))
        .eq("requested_by", str(admin.admin_id))
        .limit(1)
        .execute()
    )
    if not response.data:
        raise not_found("That research job could not be found.")
    return _job_row_to_dict(response.data[0])


def create_draft_from_job(admin: AdminContext, job_id: UUID) -> AdminCardResponse:
    job = get_research_job(admin, job_id)
    if job["status"] != "complete" or not job.get("result"):
        raise validation_error(
            "Only completed research jobs with a result can create a draft."
        )

    draft = CardDraftImport.model_validate(job["result"])
    return import_card_draft(admin, draft)


def execute_research_job(job_id: UUID, admin_id: UUID) -> None:
    client = get_supabase_client()
    job_response = (
        client.table("research_jobs")
        .select(JOB_SELECT)
        .eq("id", str(job_id))
        .eq("requested_by", str(admin_id))
        .limit(1)
        .execute()
    )
    if not job_response.data:
        return

    job = job_response.data[0]
    if job["status"] != "pending":
        return

    provider = ResearchProvider(job["provider"])
    completed_at = datetime.now(UTC).isoformat()

    try:
        api_key = _get_provider_api_key(admin_id, provider)
        category_slugs = [category.slug for category in list_categories()]
        tag_names = [tag.name for tag in list_tags()]
        draft = run_provider_research(
            provider=provider,
            api_key=api_key,
            question=job["question"],
            category_slugs=category_slugs,
            tag_names=tag_names,
        )
        result_payload = draft.model_dump(mode="json")
        client.table("research_jobs").update(
            {
                "status": "complete",
                "result": result_payload,
                "error_message": None,
                "completed_at": completed_at,
            }
        ).eq("id", str(job_id)).execute()
    except Exception as exc:
        safe_message = _safe_error_message(exc)
        client.table("research_jobs").update(
            {
                "status": "failed",
                "error_message": safe_message,
                "completed_at": completed_at,
            }
        ).eq("id", str(job_id)).execute()


def _safe_error_message(exc: Exception) -> str:
    from app.core.errors import ApiError

    if isinstance(exc, ApiError):
        return exc.message
    return "Research failed. Check the provider key and try again."


def _job_row_to_dict(row: dict) -> dict:
    return {
        "id": row["id"],
        "question": row["question"],
        "status": row["status"],
        "provider": row["provider"],
        "result": row.get("result"),
        "error_message": row.get("error_message"),
        "requested_by": row["requested_by"],
        "created_at": row["created_at"],
        "completed_at": row.get("completed_at"),
    }
