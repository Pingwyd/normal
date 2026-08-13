import { apiGet } from "@/lib/api/client";
import type {
  AffirmationSummary,
  DailyContentPage,
} from "@/lib/api/daily-content-types";

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

export async function fetchAffirmationsPageServer(
  params: AffirmationsQuery = {},
): Promise<DailyContentPage<AffirmationSummary>> {
  const { data, meta } = await apiGet<AffirmationSummary[]>(
    `/v1/affirmations${buildQuery(params)}`,
    { cache: "no-store" },
  );
  return { items: data, meta };
}

export async function fetchAffirmationByIdServer(
  id: string,
): Promise<AffirmationSummary | null> {
  let after: string | undefined;
  for (let page = 0; page < 10; page += 1) {
    const { items, meta } = await fetchAffirmationsPageServer({
      after,
      limit: 50,
    });
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
