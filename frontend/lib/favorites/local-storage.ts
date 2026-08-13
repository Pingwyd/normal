import type { FavoriteContentType } from "./keys";

export const ANONYMOUS_FAVORITES_STORAGE_KEY = "normal:local_favorites";

const STORAGE_VERSION = 1;

export type LocalFavoriteItem = {
  content_type: FavoriteContentType;
  content_id: string;
};

type StoredAnonymousFavorites = {
  version: number;
  items: LocalFavoriteItem[];
};

function isLocalFavoriteItem(value: unknown): value is LocalFavoriteItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    (record.content_type === "card" ||
      record.content_type === "affirmation" ||
      record.content_type === "quote") &&
    typeof record.content_id === "string" &&
    record.content_id.length > 0
  );
}

function dedupeItems(items: LocalFavoriteItem[]): LocalFavoriteItem[] {
  const seen = new Set<string>();
  const deduped: LocalFavoriteItem[] = [];

  for (const item of items) {
    const key = `${item.content_type}:${item.content_id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

export function readAnonymousFavorites(): LocalFavoriteItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(ANONYMOUS_FAVORITES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredAnonymousFavorites;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.items)) {
      return [];
    }
    return dedupeItems(parsed.items.filter(isLocalFavoriteItem));
  } catch {
    return [];
  }
}

export function writeAnonymousFavorites(items: LocalFavoriteItem[]): void {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredAnonymousFavorites = {
    version: STORAGE_VERSION,
    items: dedupeItems(items),
  };
  window.localStorage.setItem(
    ANONYMOUS_FAVORITES_STORAGE_KEY,
    JSON.stringify(payload),
  );
}

export function clearAnonymousFavorites(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(ANONYMOUS_FAVORITES_STORAGE_KEY);
}
