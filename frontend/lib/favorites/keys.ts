export type FavoriteContentType = "card" | "affirmation" | "quote";

const CONTENT_TYPES = new Set<FavoriteContentType>([
  "card",
  "affirmation",
  "quote",
]);

export function favoriteKey(
  contentType: FavoriteContentType,
  contentId: string,
): string {
  return `${contentType}:${contentId}`;
}

export function parseFavoriteKey(
  key: string,
): { contentType: FavoriteContentType; contentId: string } | null {
  const separatorIndex = key.indexOf(":");
  if (separatorIndex <= 0) {
    return null;
  }

  const contentType = key.slice(0, separatorIndex);
  const contentId = key.slice(separatorIndex + 1);
  if (!contentId || !CONTENT_TYPES.has(contentType as FavoriteContentType)) {
    return null;
  }

  return {
    contentType: contentType as FavoriteContentType,
    contentId,
  };
}
