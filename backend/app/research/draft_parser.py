import json
import re

from app.content.draft_import_schemas import CardDraftImport
from app.core.errors import validation_error


def parse_research_json(raw_text: str) -> CardDraftImport:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise validation_error(
            "Research provider returned invalid JSON. Try again or switch providers."
        ) from exc
    return CardDraftImport.model_validate(payload)
