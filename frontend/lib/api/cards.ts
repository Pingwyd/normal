import { apiGet } from "./client";
import type {
  BrowseSearchParams,
  CardDetail,
  CardSummary,
  PaginationMeta,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_PAGINATION_PAGES = 5;

function buildCardsQuery(params: BrowseSearchParams): string {
  const search = new URLSearchParams();
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.category) {
    search.set("category", params.category);
  }
  if (params.tags) {
    search.set("tags", params.tags);
  }
  if (params.after) {
    search.set("after", params.after);
  }
  search.set("limit", String(params.limit ?? DEFAULT_LIMIT));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function fetchCardSuggestions(query: string): Promise<CardSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const { cards } = await fetchCardPage({ q: trimmed, limit: 5 });
  return cards;
}

export async function fetchCardPage(
  params: BrowseSearchParams,
): Promise<{ cards: CardSummary[]; meta: PaginationMeta | null }> {
  const { data, meta } = await apiGet<CardSummary[]>(
    `/v1/cards${buildCardsQuery(params)}`,
  );

  if (!Array.isArray(data)) {
    throw new Error("The server returned an invalid card list.");
  }

  return { cards: data, meta };
}

export async function fetchAccumulatedCards(
  params: BrowseSearchParams,
): Promise<{ cards: CardSummary[]; meta: PaginationMeta | null }> {
  const checkpoint = params.after;
  if (!checkpoint) {
    return fetchCardPage(params);
  }

  const accumulated: CardSummary[] = [];
  let cursor: string | undefined;
  let meta: PaginationMeta | null = null;

  for (let page = 0; page < MAX_PAGINATION_PAGES; page += 1) {
    const response = await fetchCardPage({
      ...params,
      after: cursor,
    });
    accumulated.push(...response.cards);
    meta = response.meta;

    if (!response.meta?.has_more || !response.meta.next_cursor) {
      break;
    }

    if (response.meta.next_cursor === checkpoint) {
      break;
    }

    cursor = response.meta.next_cursor;
  }

  return { cards: accumulated, meta };
}

export async function fetchCardBySlug(slug: string): Promise<CardDetail> {
  const { data } = await apiGet<CardDetail>(`/v1/cards/${slug}`);
  return data;
}
