import type { BrowseSearchParams } from "./api/types";

export function parseBrowseSearchParams(
  raw: Record<string, string | string[] | undefined>,
): BrowseSearchParams {
  const read = (key: string): string | undefined => {
    const value = raw[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const limitRaw = read("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  return {
    q: read("q"),
    category: read("category"),
    tags: read("tags"),
    after: read("after"),
    limit: Number.isFinite(limit) ? limit : undefined,
  };
}

export function buildBrowseHref(params: BrowseSearchParams): string {
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
  if (params.limit) {
    search.set("limit", String(params.limit));
  }
  const query = search.toString();
  return query ? `/?${query}` : "/";
}

export function withBrowseUpdates(
  current: BrowseSearchParams,
  updates: Partial<BrowseSearchParams> & { resetPagination?: boolean },
): BrowseSearchParams {
  const next: BrowseSearchParams = { ...current, ...updates };
  if (updates.resetPagination) {
    delete next.after;
  }
  return next;
}
