import type { FavoriteContentType } from "@/lib/favorites/keys";

import type {
  FavoriteItem,
  FavoriteToggleResponse,
} from "@/lib/api/account-types";

export async function fetchAccountSession(): Promise<{ id: string } | null> {
  const response = await fetch("/api/account/session", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as {
    account: { id: string } | null;
  };
  return body.account;
}

export async function fetchAccountFavorites(): Promise<FavoriteItem[]> {
  const response = await fetch("/api/account/favorites", {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    throw new Error("Could not load saved items.");
  }

  const body = (await response.json()) as { data: FavoriteItem[] };
  return body.data ?? [];
}

export async function toggleAccountFavorite(
  contentType: FavoriteContentType,
  contentId: string,
  favorited: boolean,
): Promise<FavoriteToggleResponse> {
  const response = await fetch("/api/account/favorites", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content_type: contentType,
      content_id: contentId,
      favorited,
    }),
  });

  const body = (await response.json()) as {
    data: FavoriteToggleResponse | null;
    error: { code: string; message: string } | null;
  };

  if (!response.ok || body.error || !body.data) {
    throw new Error(body.error?.message ?? "Could not update saved state.");
  }

  return body.data;
}
