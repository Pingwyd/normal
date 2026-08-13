"""Seed published affirmations and quotes for deck testing.

Requires backend/.env (or .env.local) with:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Usage (from backend/):
  python scripts/seed_daily_content.py
"""

# ruff: noqa: E501

from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def _load_env_file(path: Path) -> None:
    if not path.exists():
        return
    raw = path.read_bytes()
    if raw.startswith(b"\xff\xfe") or raw.startswith(b"\xfe\xff"):
        content = raw.decode("utf-16")
    else:
        content = raw.decode("utf-8-sig")
    for line in content.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


for env_name in (".env", ".env.local"):
    _load_env_file(BACKEND_ROOT / env_name)

REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")

TAG_NAMES = (
    "anxiety",
    "calm",
    "self-compassion",
    "confidence",
    "rest",
)

AFFIRMATIONS: list[tuple[str, list[str]]] = [
    (
        "I can notice anxious thoughts without letting them run the whole day.",
        ["anxiety", "calm"],
    ),
    (
        "Feeling nervous before something important does not mean I am failing.",
        ["anxiety", "confidence"],
    ),
    (
        "I am allowed to rest without earning it first.",
        ["rest", "self-compassion"],
    ),
    (
        "Uncertainty is uncomfortable, and I can still take one small step.",
        ["anxiety", "confidence"],
    ),
    (
        "My worth is not measured by how productive I am today.",
        ["self-compassion", "rest"],
    ),
    (
        "I can be kind to myself and still hold myself accountable.",
        ["self-compassion", "confidence"],
    ),
    (
        "It is okay to ask for help when something feels heavier than usual.",
        ["anxiety", "self-compassion"],
    ),
    (
        "I do not need to compare my inner life to someone else's highlight reel.",
        ["anxiety", "calm"],
    ),
    (
        "A hard moment can be real without defining my whole story.",
        ["self-compassion", "calm"],
    ),
    (
        "I can set a boundary even if someone else does not understand it.",
        ["confidence", "self-compassion"],
    ),
    ("Progress can be quiet and still count.", ["confidence", "calm"]),
    (
        "I am learning what works for me, and that takes time.",
        ["self-compassion", "confidence"],
    ),
    (
        "I can feel disappointed and still trust that I will adapt.",
        ["calm", "confidence"],
    ),
    (
        "My emotions can be information, not instructions I must obey.",
        ["calm", "self-compassion"],
    ),
    ("I do not have to resolve everything tonight.", ["rest", "calm"]),
    (
        "Being sensitive is not the same as being weak.",
        ["self-compassion", "confidence"],
    ),
    (
        "I can celebrate small wins without waiting for the perfect outcome.",
        ["confidence", "calm"],
    ),
    (
        "It is normal to need space after a draining day.",
        ["rest", "anxiety"],
    ),
    (
        "I can change my mind when I learn something new.",
        ["confidence", "self-compassion"],
    ),
    ("Showing up honestly is enough for today.", ["calm", "self-compassion"]),
]

QUOTES: list[tuple[str, str, str]] = [
    (
        "Courage is not the absence of fear, but the judgment that something else is more important.",
        "Ambrose Redmoon",
        "https://www.goodreads.com/quotes/684-courage-is-not-the-absence-of-fear",
    ),
    (
        "You do not have to control your thoughts. You just have to stop letting them control you.",
        "Dan Millman",
        "https://www.goodreads.com/quotes/102928-you-don-t-have-to-control-your-thoughts",
    ),
    (
        "Feelings are much like waves. We cannot stop them from coming, but we can choose which ones to surf.",
        "Jonatan Martensson",
        "https://www.goodreads.com/quotes/56427-feelings-are-much-like-waves",
    ),
    (
        "Talk to yourself like you would to someone you love.",
        "Brené Brown",
        "https://brenebrown.com/resources/",
    ),
    (
        "The only way out is through.",
        "Robert Frost",
        "https://www.poetryfoundation.org/poets/robert-frost",
    ),
    (
        "Rest when you are weary. Refresh and renew yourself, your body, your mind, your spirit.",
        "Lailah Gifty Akita",
        "https://www.goodreads.com/author/quotes/7792250.Lailah_Gifty_Akita",
    ),
    (
        "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
        "Ralph Waldo Emerson",
        "https://www.poetryfoundation.org/poets/ralph-waldo-emerson",
    ),
    (
        "You are not a drop in the ocean. You are the entire ocean in a drop.",
        "Rumi",
        "https://www.poetryfoundation.org/poets/rumi",
    ),
    (
        "Nothing can bring you peace but yourself.",
        "Ralph Waldo Emerson",
        "https://www.poetryfoundation.org/poets/ralph-waldo-emerson",
    ),
    (
        "The present moment is filled with joy and happiness. If you are attentive, you will see it.",
        "Thich Nhat Hanh",
        "https://plumvillage.org/about/thich-nhat-hanh/",
    ),
    (
        "Almost everything will work again if you unplug it for a few minutes, including you.",
        "Anne Lamott",
        "https://www.anne-lamott.com/",
    ),
    (
        "It is not the load that breaks you down. It is the way you carry it.",
        "Lou Holtz",
        "https://www.goodreads.com/quotes/16790-it-s-not-the-load-that-breaks-you-down",
    ),
    (
        "You must learn a new way to think before you can master a new way to be.",
        "Marianne Williamson",
        "https://marianne.com/",
    ),
    (
        "Do not let the behavior of others destroy your inner peace.",
        "Dalai Lama",
        "https://www.dalailama.com/",
    ),
    (
        "The wound is the place where the light enters you.",
        "Rumi",
        "https://www.poetryfoundation.org/poets/rumi",
    ),
    (
        "Self-compassion is simply giving the same kindness to ourselves that we would give to others.",
        "Christopher Germer",
        "https://chrisgermer.com/",
    ),
    (
        "You are braver than you believe, stronger than you seem, and smarter than you think.",
        "A.A. Milne",
        "https://www.goodreads.com/quotes/58964-you-are-braver-than-you-believe",
    ),
    (
        "The most wasted of all days is one without laughter.",
        "Nicolas Chamfort",
        "https://www.goodreads.com/quotes/467-the-most-wasted-of-all-days",
    ),
    (
        "Life is not what it is supposed to be. It is what it is. The way you cope with it is what makes the difference.",
        "Virginia Satir",
        "https://www.virginiasatir.org/",
    ),
    (
        "You do not have to be perfect to be worthy of care.",
        "Unknown",
        "https://example.org/normal/quote-source",
    ),
]


def _require_env() -> None:
    missing = [name for name in REQUIRED_ENV if not os.environ.get(name)]
    if missing:
        joined = ", ".join(missing)
        raise SystemExit(
            f"Missing required environment variables: {joined}. "
            "Set them in backend/.env before running this script."
        )


def _existing_texts(client, table: str) -> set[str]:
    response = client.table(table).select("text").execute()
    return {row["text"] for row in response.data}


def _ensure_tags(client) -> dict[str, str]:
    tag_ids: dict[str, str] = {}
    existing = client.table("tags").select("id, name").execute()
    for row in existing.data:
        tag_ids[row["name"]] = row["id"]

    for name in TAG_NAMES:
        if name in tag_ids:
            continue
        inserted = client.table("tags").insert({"name": name}).execute()
        tag_ids[name] = inserted.data[0]["id"]

    return tag_ids


def seed_affirmations(client) -> tuple[int, int]:
    tag_ids = _ensure_tags(client)
    existing = _existing_texts(client, "affirmations")
    inserted_count = 0
    tag_links = 0

    for text, tag_names in AFFIRMATIONS:
        if text in existing:
            continue

        response = (
            client.table("affirmations")
            .insert({"text": text, "status": "published"})
            .execute()
        )
        affirmation_id = response.data[0]["id"]
        existing.add(text)
        inserted_count += 1

        rows = [
            {"affirmation_id": affirmation_id, "tag_id": tag_ids[tag_name]}
            for tag_name in tag_names
            if tag_name in tag_ids
        ]
        if rows:
            client.table("affirmation_tags").insert(rows).execute()
            tag_links += len(rows)

    return inserted_count, tag_links


def seed_quotes(client) -> int:
    existing = _existing_texts(client, "quotes")
    inserted_count = 0

    for text, attributed_to, source_url in QUOTES:
        if text in existing:
            continue

        client.table("quotes").insert(
            {
                "text": text,
                "attributed_to": attributed_to,
                "source_url": source_url,
                "status": "published",
            }
        ).execute()
        existing.add(text)
        inserted_count += 1

    return inserted_count


def main() -> None:
    _require_env()

    from app.auth.service import get_supabase_client

    client = get_supabase_client()
    affirmation_count, tag_links = seed_affirmations(client)
    quote_count = seed_quotes(client)

    affirmations_total = client.table("affirmations").select("id", count="exact").execute()
    quotes_total = client.table("quotes").select("id", count="exact").execute()

    print(f"Inserted {affirmation_count} affirmations ({tag_links} tag links).")
    print(f"Inserted {quote_count} quotes.")
    print(f"Totals: {affirmations_total.count} affirmations, {quotes_total.count} quotes.")


if __name__ == "__main__":
    main()
