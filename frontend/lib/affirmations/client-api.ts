import type {
  AffirmationSummary,
  DailyContentPage,
} from "@/lib/api/daily-content-types";
import type { PaginationMeta } from "@/lib/api/types";

type AffirmationsQuery = {
  mood?: string;
  tag?: string;
  after?: string;
  limit?: number;
};

function buildQuery(params: AffirmationsQuery): string {
  const search = new URLSearchParams();
  if (params.mood) {
    search.set("mood", params.mood);
  }
  if (params.tag) {
    search.set("tag", params.tag);
  }
  if (params.after) {
    search.set("after", params.after);
  }
  search.set("limit", String(params.limit ?? 20));
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function parseListResponse(
  response: Response,
): Promise<DailyContentPage<AffirmationSummary>> {
  const body = (await response.json()) as {
    data: AffirmationSummary[] | null;
    meta: PaginationMeta | null;
    error: { code: string; message: string } | null;
  };

  if (!response.ok || body.error || !body.data) {
    throw new Error(body.error?.message ?? "Could not load affirmations.");
  }

  return { items: body.data, meta: body.meta };
}

export async function fetchAffirmationsPage(
  params: AffirmationsQuery = {},
): Promise<DailyContentPage<AffirmationSummary>> {
  const response = await fetch(`/api/affirmations${buildQuery(params)}`, {
    cache: "no-store",
  });
  return parseListResponse(response);
}

export async function fetchAffirmationById(
  id: string,
): Promise<AffirmationSummary | null> {
  let after: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const { items, meta } = await fetchAffirmationsPage({ after, limit: 50 });
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
