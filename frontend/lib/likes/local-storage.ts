export const LOCAL_LIKES_STORAGE_KEY = "normal:card_likes";

const STORAGE_VERSION = 1;

type StoredLocalLikes = {
  version: number;
  card_ids: string[];
};

function readStoredCardIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(LOCAL_LIKES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredLocalLikes;
    if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.card_ids)) {
      return [];
    }
    return parsed.card_ids.filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
  } catch {
    return [];
  }
}

export function readLocalLike(cardId: string): boolean {
  return readStoredCardIds().includes(cardId);
}

export function writeLocalLike(cardId: string, liked: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  const cardIds = new Set(readStoredCardIds());
  if (liked) {
    cardIds.add(cardId);
  } else {
    cardIds.delete(cardId);
  }

  const payload: StoredLocalLikes = {
    version: STORAGE_VERSION,
    card_ids: [...cardIds],
  };
  window.localStorage.setItem(LOCAL_LIKES_STORAGE_KEY, JSON.stringify(payload));
}
