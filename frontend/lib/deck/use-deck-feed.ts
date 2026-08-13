"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { PaginationMeta } from "@/lib/api/types";

type DeckFeedState<T> = {
  items: T[];
  index: number;
  isLoading: boolean;
  errorMessage: string | null;
  hasMore: boolean;
};

type UseDeckFeedOptions<T> = {
  initialItems: T[];
  initialMeta: PaginationMeta | null;
  fetchPage: (
    after?: string,
  ) => Promise<{ items: T[]; meta: PaginationMeta | null }>;
  getItemId: (item: T) => string;
};

export function useDeckFeed<T>({
  initialItems,
  initialMeta,
  fetchPage,
  getItemId,
}: UseDeckFeedOptions<T>) {
  const cursorRef = useRef<string | null>(initialMeta?.next_cursor ?? null);
  const hasMoreRef = useRef(Boolean(initialMeta?.has_more));
  const loadingRef = useRef(false);
  const [state, setState] = useState<DeckFeedState<T>>({
    items: initialItems,
    index: 0,
    isLoading: false,
    errorMessage: null,
    hasMore: Boolean(initialMeta?.has_more),
  });

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current || !cursorRef.current) {
      return;
    }

    loadingRef.current = true;
    setState((current) => ({
      ...current,
      isLoading: true,
      errorMessage: null,
    }));

    try {
      const page = await fetchPage(cursorRef.current);
      cursorRef.current = page.meta?.next_cursor ?? null;
      hasMoreRef.current = Boolean(
        page.meta?.has_more && page.meta.next_cursor,
      );

      setState((current) => {
        const seen = new Set(current.items.map(getItemId));
        const merged = [...current.items];
        for (const item of page.items) {
          const id = getItemId(item);
          if (!seen.has(id)) {
            seen.add(id);
            merged.push(item);
          }
        }
        return {
          ...current,
          items: merged,
          isLoading: false,
          hasMore: hasMoreRef.current,
        };
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        isLoading: false,
        errorMessage:
          error instanceof Error ? error.message : "Could not load more items.",
      }));
    } finally {
      loadingRef.current = false;
    }
  }, [fetchPage, getItemId]);

  useEffect(() => {
    if (state.index >= state.items.length - 3) {
      void loadMore();
    }
  }, [loadMore, state.index, state.items.length]);

  const advance = useCallback(() => {
    setState((current) => ({
      ...current,
      index: Math.min(current.index + 1, current.items.length),
    }));
  }, []);

  const currentItem =
    state.index < state.items.length ? state.items[state.index] : null;

  return {
    ...state,
    currentItem,
    advance,
    loadMore,
  };
}
