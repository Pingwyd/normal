from datetime import UTC, datetime
from unittest.mock import MagicMock, patch
from uuid import UUID

import pytest

from app.auth.models import AdminContext, AdminRole
from app.content.admin_schemas import AdminCardUpdate, CardStatus
from app.content.admin_service import delete_admin_card, update_admin_card
from app.content.affirmations_schemas import AdminAffirmationUpdate
from app.content.affirmations_service import (
    delete_admin_affirmation,
    update_admin_affirmation,
)
from app.content.daily_content_schemas import DailyContentStatus
from app.content.quotes_schemas import AdminQuoteUpdate
from app.content.quotes_service import delete_admin_quote, update_admin_quote
from app.core.errors import ApiError
from app.reflections.admin_schemas import AdminReflectionUpdate, ReflectionStatus
from app.reflections.admin_service import (
    delete_admin_reflection,
    update_admin_reflection,
)

CARD_ID = UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
AFFIRMATION_ID = UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
QUOTE_ID = UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
REFLECTION_ID = UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
ADMIN_ID = UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
AUTH_ID = UUID("11111111-1111-1111-1111-111111111111")

ADMIN_CONTEXT = AdminContext(
    auth_id=AUTH_ID,
    admin_id=ADMIN_ID,
    role=AdminRole.FOUNDER,
    display_name="Founder User",
)


def _mock_supabase_chain() -> MagicMock:
    client_mock = MagicMock()
    table_mock = MagicMock()
    client_mock.table.return_value = table_mock
    return client_mock


def _limit_execute(table: MagicMock) -> MagicMock:
    return table.select.return_value.eq.return_value.limit.return_value.execute


def _update_execute(table: MagicMock) -> MagicMock:
    return table.update.return_value.eq.return_value.execute


def _submissions_check(submissions_table: MagicMock) -> None:
    chain = submissions_table.select.return_value.eq.return_value.limit.return_value
    chain.execute.return_value = MagicMock(data=[])


def _review_log_publish_check(
    review_log_table: MagicMock, *, has_history: bool
) -> None:
    chain = review_log_table.select.return_value
    chain = chain.eq.return_value.eq.return_value.eq.return_value
    chain.limit.return_value.execute.return_value = MagicMock(
        data=[{"id": "log-1"}] if has_history else []
    )


def _delete_execute(table: MagicMock) -> MagicMock:
    return table.delete.return_value.eq.return_value.execute


def _card_select_execute(cards_table: MagicMock, *, card_id: UUID, status: str) -> None:
    chain = cards_table.select.return_value.eq.return_value.limit.return_value
    chain.execute.return_value = MagicMock(
        data=[{"id": str(card_id), "status": status}]
    )


@patch("app.content.admin_service.trigger_card_revalidation")
@patch("app.content.admin_service.insert_review_log")
@patch("app.content.admin_service.get_admin_card")
@patch("app.content.admin_service.get_supabase_client")
def test_unpublish_card_writes_review_log_and_revalidates(
    mock_get_client: MagicMock,
    mock_get_card: MagicMock,
    mock_insert_log: MagicMock,
    mock_revalidate: MagicMock,
) -> None:
    client_mock = _mock_supabase_chain()
    mock_get_client.return_value = client_mock
    cards_table = client_mock.table.return_value
    _limit_execute(cards_table).return_value = MagicMock(
        data=[
            {
                "id": str(CARD_ID),
                "slug": "test-card",
                "status": "published",
                "requires_clinical_review": False,
                "category_id": str(UUID("ffffffff-ffff-ffff-ffff-ffffffffffff")),
                "question": "Q",
                "brief": "B",
                "published_at": datetime.now(UTC).isoformat(),
            }
        ]
    )
    _update_execute(cards_table).return_value = MagicMock(data=[])
    mock_get_card.return_value = MagicMock()

    update_admin_card(
        ADMIN_CONTEXT,
        CARD_ID,
        AdminCardUpdate(status=CardStatus.UNPUBLISHED),
    )

    mock_insert_log.assert_called_once()
    assert mock_insert_log.call_args.kwargs["action"] == "unpublished"
    assert mock_insert_log.call_args.kwargs["entity_type"].value == "card"
    mock_revalidate.assert_called_once_with("test-card")


@patch("app.content.affirmations_service.trigger_affirmation_revalidation")
@patch("app.content.affirmations_service.insert_review_log")
@patch("app.content.affirmations_service.get_admin_affirmation")
@patch("app.content.affirmations_service.get_supabase_client")
def test_unpublish_affirmation_writes_review_log_and_revalidates(
    mock_get_client: MagicMock,
    mock_get_affirmation: MagicMock,
    mock_insert_log: MagicMock,
    mock_revalidate: MagicMock,
) -> None:
    client_mock = _mock_supabase_chain()
    mock_get_client.return_value = client_mock
    affirmations_table = client_mock.table.return_value
    _limit_execute(affirmations_table).return_value = MagicMock(
        data=[{"id": str(AFFIRMATION_ID), "status": "published"}]
    )
    _update_execute(affirmations_table).return_value = MagicMock(data=[])
    mock_get_affirmation.return_value = MagicMock()

    update_admin_affirmation(
        ADMIN_CONTEXT,
        AFFIRMATION_ID,
        AdminAffirmationUpdate(status=DailyContentStatus.UNPUBLISHED),
    )

    mock_insert_log.assert_called_once()
    assert mock_insert_log.call_args.kwargs["action"] == "unpublished"
    mock_revalidate.assert_called_once_with(AFFIRMATION_ID)


@patch("app.content.quotes_service.trigger_quote_revalidation")
@patch("app.content.quotes_service.insert_review_log")
@patch("app.content.quotes_service.get_admin_quote")
@patch("app.content.quotes_service.get_supabase_client")
def test_unpublish_quote_writes_review_log_and_revalidates(
    mock_get_client: MagicMock,
    mock_get_quote: MagicMock,
    mock_insert_log: MagicMock,
    mock_revalidate: MagicMock,
) -> None:
    client_mock = _mock_supabase_chain()
    mock_get_client.return_value = client_mock
    quotes_table = client_mock.table.return_value
    _limit_execute(quotes_table).return_value = MagicMock(
        data=[
            {
                "id": str(QUOTE_ID),
                "text": "Quote",
                "attributed_to": "Author",
                "source_url": "https://example.com",
                "status": "published",
            }
        ]
    )
    _update_execute(quotes_table).return_value = MagicMock(data=[])
    mock_get_quote.return_value = MagicMock()

    update_admin_quote(
        ADMIN_CONTEXT,
        QUOTE_ID,
        AdminQuoteUpdate(status=DailyContentStatus.UNPUBLISHED),
    )

    mock_insert_log.assert_called_once()
    assert mock_insert_log.call_args.kwargs["action"] == "unpublished"
    mock_revalidate.assert_called_once_with(QUOTE_ID)


@patch("app.reflections.admin_service.trigger_reflection_revalidation")
@patch("app.reflections.admin_service.insert_review_log")
@patch("app.reflections.admin_service.get_admin_reflection")
@patch("app.reflections.admin_service.get_supabase_client")
def test_unpublish_reflection_writes_review_log_and_revalidates(
    mock_get_client: MagicMock,
    mock_get_reflection: MagicMock,
    mock_insert_log: MagicMock,
    mock_revalidate: MagicMock,
) -> None:
    client_mock = _mock_supabase_chain()
    mock_get_client.return_value = client_mock
    reflections_table = client_mock.table.return_value
    _limit_execute(reflections_table).return_value = MagicMock(
        data=[
            {
                "id": str(REFLECTION_ID),
                "slug": "test-reflection",
                "format": "short",
                "status": "published",
                "published_at": datetime.now(UTC).isoformat(),
                "is_crisis_adjacent": False,
                "title": "Title",
                "brief": "Brief",
            }
        ]
    )
    _update_execute(reflections_table).return_value = MagicMock(data=[])
    mock_get_reflection.return_value = MagicMock()

    update_admin_reflection(
        ADMIN_CONTEXT,
        REFLECTION_ID,
        AdminReflectionUpdate(status=ReflectionStatus.UNPUBLISHED),
    )

    mock_insert_log.assert_called_once()
    assert mock_insert_log.call_args.kwargs["action"] == "unpublished"
    mock_revalidate.assert_called_once_with("test-reflection")


@patch("app.content.admin_service.get_supabase_client")
def test_delete_draft_card_succeeds(mock_get_client: MagicMock) -> None:
    client_mock = MagicMock()
    mock_get_client.return_value = client_mock
    cards_table = MagicMock()
    review_log_table = MagicMock()
    submissions_table = MagicMock()

    def table_router(name: str) -> MagicMock:
        if name == "cards":
            return cards_table
        if name == "review_log":
            return review_log_table
        if name == "submissions":
            return submissions_table
        raise AssertionError(f"Unexpected table: {name}")

    client_mock.table.side_effect = table_router

    _card_select_execute(cards_table, card_id=CARD_ID, status="draft")
    _review_log_publish_check(review_log_table, has_history=False)
    _submissions_check(submissions_table)
    cards_table.delete.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": str(CARD_ID)}]
    )

    delete_admin_card(CARD_ID)

    cards_table.delete.assert_called_once()


@patch("app.content.admin_service.get_supabase_client")
def test_delete_published_card_rejected(mock_get_client: MagicMock) -> None:
    client_mock = _mock_supabase_chain()
    mock_get_client.return_value = client_mock
    cards_table = client_mock.table.return_value
    _limit_execute(cards_table).return_value = MagicMock(
        data=[{"id": str(CARD_ID), "status": "published"}]
    )

    with pytest.raises(ApiError) as exc_info:
        delete_admin_card(CARD_ID)

    assert exc_info.value.code == "CANNOT_DELETE_PUBLISHED_CONTENT"
    cards_table.delete.assert_not_called()


@patch("app.content.admin_service.get_supabase_client")
def test_delete_unpublished_card_with_publish_history_rejected(
    mock_get_client: MagicMock,
) -> None:
    client_mock = _mock_supabase_chain()
    mock_get_client.return_value = client_mock
    cards_table = MagicMock()
    review_log_table = MagicMock()
    client_mock.table.side_effect = lambda name: (
        review_log_table if name == "review_log" else cards_table
    )
    _card_select_execute(cards_table, card_id=CARD_ID, status="draft")
    _review_log_publish_check(review_log_table, has_history=True)

    with pytest.raises(ApiError) as exc_info:
        delete_admin_card(CARD_ID)

    assert exc_info.value.code == "CANNOT_DELETE_PUBLISHED_CONTENT"
    cards_table.delete.assert_not_called()


@patch("app.content.affirmations_service.get_supabase_client")
def test_delete_draft_affirmation_succeeds(mock_get_client: MagicMock) -> None:
    client_mock = _mock_supabase_chain()
    mock_get_client.return_value = client_mock
    affirmations_table = client_mock.table.return_value
    _limit_execute(affirmations_table).side_effect = [
        MagicMock(data=[{"id": str(AFFIRMATION_ID), "status": "draft"}]),
    ]
    review_log_table = MagicMock()
    client_mock.table.side_effect = lambda name: (
        review_log_table if name == "review_log" else affirmations_table
    )
    _review_log_publish_check(review_log_table, has_history=False)
    _delete_execute(affirmations_table).return_value = MagicMock(
        data=[{"id": str(AFFIRMATION_ID)}]
    )

    delete_admin_affirmation(AFFIRMATION_ID)

    affirmations_table.delete.assert_called_once()


@patch("app.content.quotes_service.get_supabase_client")
def test_delete_unpublished_quote_rejected(mock_get_client: MagicMock) -> None:
    client_mock = _mock_supabase_chain()
    mock_get_client.return_value = client_mock
    quotes_table = client_mock.table.return_value
    _limit_execute(quotes_table).return_value = MagicMock(
        data=[{"id": str(QUOTE_ID), "status": "unpublished"}]
    )

    with pytest.raises(ApiError) as exc_info:
        delete_admin_quote(QUOTE_ID)

    assert exc_info.value.code == "CANNOT_DELETE_PUBLISHED_CONTENT"


@patch("app.reflections.admin_service.get_supabase_client")
def test_delete_draft_reflection_succeeds(mock_get_client: MagicMock) -> None:
    client_mock = _mock_supabase_chain()
    mock_get_client.return_value = client_mock
    reflections_table = client_mock.table.return_value
    _limit_execute(reflections_table).side_effect = [
        MagicMock(data=[{"id": str(REFLECTION_ID), "status": "draft"}]),
    ]
    review_log_table = MagicMock()
    client_mock.table.side_effect = lambda name: (
        review_log_table if name == "review_log" else reflections_table
    )
    _review_log_publish_check(review_log_table, has_history=False)
    _delete_execute(reflections_table).return_value = MagicMock(
        data=[{"id": str(REFLECTION_ID)}]
    )

    delete_admin_reflection(REFLECTION_ID)

    reflections_table.delete.assert_called_once()
