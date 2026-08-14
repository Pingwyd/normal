import { apiGet } from "@/lib/api/client";
import type { PaginationMeta } from "@/lib/api/types";
import type {
  ReflectionDetail,
  ReflectionSummary,
  ReflectionsPage,
  ReflectionsQuery,
} from "@/lib/api/reflection-types";

const MAX_PAGINATION_PAGES = 20;

function buildQuery(params: ReflectionsQuery): string {
  const search = new URLSearchParams();
  if (params.tag) {
    search.set("tag", params.tag);
  }
  if (params.format) {
    search.set("format", params.format);
  }
  if (params.after) {
    search.set("after", params.after);
  }
  search.set("limit", String(params.limit ?? 20));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function fetchReflectionsPageServer(
  params: ReflectionsQuery = {},
): Promise<ReflectionsPage> {
  const { data, meta } = await apiGet<ReflectionSummary[]>(
    `/v1/reflections${buildQuery(params)}`,
    { cache: "no-store" },
  );
  return { items: data, meta };
}

export async function fetchAccumulatedReflections(
  params: ReflectionsQuery,
): Promise<{ items: ReflectionSummary[]; meta: PaginationMeta | null }> {
  const checkpoint = params.after;
  if (!checkpoint) {
    return fetchReflectionsPageServer(params);
  }

  const accumulated: ReflectionSummary[] = [];
  let cursor: string | undefined;
  let meta: PaginationMeta | null = null;

  for (let page = 0; page < MAX_PAGINATION_PAGES; page += 1) {
    const response = await fetchReflectionsPageServer({
      ...params,
      after: cursor,
    });
    accumulated.push(...response.items);
    meta = response.meta;

    if (!response.meta?.has_more || !response.meta.next_cursor) {
      break;
    }

    if (response.meta.next_cursor === checkpoint) {
      break;
    }

    cursor = response.meta.next_cursor;
  }

  return { items: accumulated, meta };
}

export async function fetchReflectionBySlugServer(
  slug: string,
): Promise<ReflectionDetail> {
  const { data } = await apiGet<ReflectionDetail>(`/v1/reflections/${slug}`, {
    cache: "no-store",
  });
  return data;
}
