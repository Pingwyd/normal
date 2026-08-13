import { apiGet } from "@/lib/api/client";
import type {
  DailyContentPage,
  QuoteSummary,
} from "@/lib/api/daily-content-types";

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

export async function fetchQuotesPageServer(
  params: QuotesQuery = {},
): Promise<DailyContentPage<QuoteSummary>> {
  const { data, meta } = await apiGet<QuoteSummary[]>(
    `/v1/quotes${buildQuery(params)}`,
    { cache: "no-store" },
  );
  return { items: data, meta };
}

export async function fetchQuoteByIdServer(
  id: string,
): Promise<QuoteSummary | null> {
  let after: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const { items, meta } = await fetchQuotesPageServer({ after, limit: 50 });
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
