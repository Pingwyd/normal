"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { AccountPublic, FavoriteItem } from "@/lib/api/account-types";
import {
  fetchAccountFavorites,
  fetchAccountSession,
  toggleAccountFavorite,
} from "@/lib/favorites/client-api";
import { favoriteKey, type FavoriteContentType } from "@/lib/favorites/keys";
import {
  clearAnonymousFavorites,
  readAnonymousFavorites,
  writeAnonymousFavorites,
  type LocalFavoriteItem,
} from "@/lib/favorites/local-storage";

type FavoritesContextValue = {
  isReady: boolean;
  accountId: string | null;
  username: string | null;
  isFavorited: (contentType: FavoriteContentType, contentId: string) => boolean;
  toggleFavorite: (
    contentType: FavoriteContentType,
    contentId: string,
  ) => Promise<void>;
  readLocalFavoritesForMerge: () => LocalFavoriteItem[];
  applyAuthenticatedSession: (
    account: AccountPublic,
    favorites: FavoriteItem[],
  ) => void;
  clearAuthenticatedSession: () => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function itemsToKeySet(
  items: Array<
    LocalFavoriteItem | Pick<FavoriteItem, "content_type" | "content_id">
  >,
): Set<string> {
  const keys = new Set<string>();
  for (const item of items) {
    keys.add(favoriteKey(item.content_type, item.content_id));
  }
  return keys;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const activeAccountIdRef = useRef<string | null>(null);

  const loadAnonymousFavorites = useCallback(() => {
    setFavoriteKeys(itemsToKeySet(readAnonymousFavorites()));
  }, []);

  const loadAuthenticatedFavorites = useCallback(
    async (nextAccountId: string) => {
      activeAccountIdRef.current = nextAccountId;
      setAccountId(nextAccountId);
      setUsername(null);
      setFavoriteKeys(new Set());

      const favorites = await fetchAccountFavorites();
      if (activeAccountIdRef.current !== nextAccountId) {
        return;
      }

      setFavoriteKeys(itemsToKeySet(favorites));
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const session = await fetchAccountSession();
        if (cancelled) {
          return;
        }

        if (session) {
          await loadAuthenticatedFavorites(session.id);
        } else {
          activeAccountIdRef.current = null;
          setAccountId(null);
          setUsername(null);
          loadAnonymousFavorites();
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadAnonymousFavorites, loadAuthenticatedFavorites]);

  const applyAuthenticatedSession = useCallback(
    (account: AccountPublic, favorites: FavoriteItem[]) => {
      clearAnonymousFavorites();
      activeAccountIdRef.current = account.id;
      setAccountId(account.id);
      setUsername(account.username);
      setFavoriteKeys(itemsToKeySet(favorites));
    },
    [],
  );

  const clearAuthenticatedSession = useCallback(() => {
    activeAccountIdRef.current = null;
    setAccountId(null);
    setUsername(null);
    setFavoriteKeys(new Set());
    loadAnonymousFavorites();
  }, [loadAnonymousFavorites]);

  const readLocalFavoritesForMerge = useCallback(
    () => readAnonymousFavorites(),
    [],
  );

  const isFavorited = useCallback(
    (contentType: FavoriteContentType, contentId: string) =>
      favoriteKeys.has(favoriteKey(contentType, contentId)),
    [favoriteKeys],
  );

  const toggleFavorite = useCallback(
    async (contentType: FavoriteContentType, contentId: string) => {
      const key = favoriteKey(contentType, contentId);
      const currentlyFavorited = favoriteKeys.has(key);
      const nextFavorited = !currentlyFavorited;
      const activeAccountId = activeAccountIdRef.current;

      if (activeAccountId) {
        const result = await toggleAccountFavorite(
          contentType,
          contentId,
          nextFavorited,
        );
        if (activeAccountIdRef.current !== activeAccountId) {
          return;
        }

        setFavoriteKeys((current) => {
          const updated = new Set(current);
          if (result.favorited) {
            updated.add(key);
          } else {
            updated.delete(key);
          }
          return updated;
        });
        return;
      }

      const items = readAnonymousFavorites();
      const nextItems = nextFavorited
        ? [...items, { content_type: contentType, content_id: contentId }]
        : items.filter(
            (item) =>
              !(
                item.content_type === contentType &&
                item.content_id === contentId
              ),
          );

      writeAnonymousFavorites(nextItems);
      setFavoriteKeys(itemsToKeySet(nextItems));
    },
    [favoriteKeys],
  );

  const value = useMemo(
    () => ({
      isReady,
      accountId,
      username,
      isFavorited,
      toggleFavorite,
      readLocalFavoritesForMerge,
      applyAuthenticatedSession,
      clearAuthenticatedSession,
    }),
    [
      isReady,
      accountId,
      username,
      isFavorited,
      toggleFavorite,
      readLocalFavoritesForMerge,
      applyAuthenticatedSession,
      clearAuthenticatedSession,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider.");
  }
  return context;
}
