import type { FavoriteContentType } from "@/lib/favorites/keys";

export const FAVORITE_METADATA_STORAGE_KEY = "normal:favorite_meta";

export type FavoriteMetadata = {
  slug?: string;
  question?: string;
};

type StoredFavoriteMetadata = {
  version: number;
  entries: Record<string, FavoriteMetadata>;
};

const STORAGE_VERSION = 1;

function contentMetaKey(contentType: FavoriteContentType, contentId: string) {
  return `${contentType}:${contentId}`;
}

function readStore(): StoredFavoriteMetadata {
  if (typeof window === "undefined") {
    return { version: STORAGE_VERSION, entries: {} };
  }

  const raw = window.localStorage.getItem(FAVORITE_METADATA_STORAGE_KEY);
  if (!raw) {
    return { version: STORAGE_VERSION, entries: {} };
  }

  try {
    const parsed = JSON.parse(raw) as StoredFavoriteMetadata;
    if (
      parsed.version !== STORAGE_VERSION ||
      typeof parsed.entries !== "object"
    ) {
      return { version: STORAGE_VERSION, entries: {} };
    }
    return parsed;
  } catch {
    return { version: STORAGE_VERSION, entries: {} };
  }
}

function writeStore(store: StoredFavoriteMetadata): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    FAVORITE_METADATA_STORAGE_KEY,
    JSON.stringify(store),
  );
}

export function rememberFavoriteMetadata(
  contentType: FavoriteContentType,
  contentId: string,
  metadata: FavoriteMetadata,
): void {
  if (!metadata.slug && !metadata.question) {
    return;
  }

  const store = readStore();
  store.entries[contentMetaKey(contentType, contentId)] = metadata;
  writeStore(store);
}

export function forgetFavoriteMetadata(
  contentType: FavoriteContentType,
  contentId: string,
): void {
  const store = readStore();
  delete store.entries[contentMetaKey(contentType, contentId)];
  writeStore(store);
}

export function readFavoriteMetadata(
  contentType: FavoriteContentType,
  contentId: string,
): FavoriteMetadata | null {
  const store = readStore();
  return store.entries[contentMetaKey(contentType, contentId)] ?? null;
}
