import type {
  DailyContentPage,
  QuoteSummary,
} from "@/lib/api/daily-content-types";
import type { PaginationMeta } from "@/lib/api/types";

type QuotesQuery = {
  after?: string;
  limit?: number;
};

function buildQuery(params: QuotesQuery): string {
  const search = new URLSearchParams();
  if (params.after) {
    search.set("after", params.after);
  }
  search.set("limit", String(params.limit ?? 20));
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function parseListResponse(
  response: Response,
): Promise<DailyContentPage<QuoteSummary>> {
  const body = (await response.json()) as {
    data: QuoteSummary[] | null;
    meta: PaginationMeta | null;
    error: { code: string; message: string } | null;
  };

  if (!response.ok || body.error || !body.data) {
    throw new Error(body.error?.message ?? "Could not load quotes.");
  }

  return { items: body.data, meta: body.meta };
}

export async function fetchQuotesPage(
  params: QuotesQuery = {},
): Promise<DailyContentPage<QuoteSummary>> {
  const response = await fetch(`/api/quotes${buildQuery(params)}`, {
    cache: "no-store",
  });
  return parseListResponse(response);
}

export async function fetchQuoteById(id: string): Promise<QuoteSummary | null> {
  let after: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const { items, meta } = await fetchQuotesPage({ after, limit: 50 });
    const match = items.find((item) => item.id === id);
    if (match) {
      return match;
    }
    if (!meta?.has_more || !meta.next_cursor) {
      break;
    }
    after = meta.next_cursor;
  }
  return null;
}
