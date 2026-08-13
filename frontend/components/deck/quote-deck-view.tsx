"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { DeckActionBar } from "@/components/deck/deck-action-bar";
import { SwipeDeck } from "@/components/deck/swipe-deck";
import type { QuoteSummary } from "@/lib/api/daily-content-types";
import { fetchQuotesPage } from "@/lib/quotes/client-api";
import {
  renderShareImageDataUrl,
  shareDeckItem,
} from "@/lib/deck/share-export";
import { useDeckFeed } from "@/lib/deck/use-deck-feed";
import type { PaginationMeta } from "@/lib/api/types";
import { rememberFavoriteMetadata } from "@/lib/favorites/metadata-cache";

type QuoteDeckViewProps = {
  initialItems: QuoteSummary[];
  initialMeta: PaginationMeta | null;
};

export function QuoteDeckView({
  initialItems,
  initialMeta,
}: QuoteDeckViewProps) {
  const { isReady, isFavorited, toggleFavorite } = useFavorites();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPage = useCallback(
    async (after?: string) => fetchQuotesPage({ after }),
    [],
  );

  const { currentItem, advance, errorMessage, isLoading, items, index } =
    useDeckFeed({
      initialItems,
      initialMeta,
      fetchPage,
      getItemId: (item) => item.id,
    });

  const saveItem = useCallback(
    async (item: QuoteSummary) => {
      if (!isReady || isSaving) {
        advance();
        return;
      }

      const alreadySaved = isFavorited("quote", item.id);
      if (alreadySaved) {
        advance();
        return;
      }

      setIsSaving(true);
      setStatusMessage(null);
      try {
        await toggleFavorite("quote", item.id);
        rememberFavoriteMetadata("quote", item.id, {
          question: item.text,
        });
        setStatusMessage("Saved to your list.");
      } catch (error) {
        setStatusMessage(
          error instanceof Error ? error.message : "Could not save quote.",
        );
      } finally {
        setIsSaving(false);
        advance();
      }
    },
    [advance, isFavorited, isReady, isSaving, toggleFavorite],
  );

  const handleShare = useCallback(async () => {
    if (!currentItem) {
      return;
    }

    const url = `${window.location.origin}/share/quotes/${currentItem.id}`;
    const imageDataUrl = renderShareImageDataUrl({
      title: "Quote",
      body: currentItem.text,
      footer: currentItem.attributed_to,
    });

    const result = await shareDeckItem({
      url,
      title: "Quote",
      text: currentItem.text,
      imageDataUrl,
    });

    if (result === "copied") {
      setStatusMessage("Link copied to clipboard.");
    } else if (result === "downloaded") {
      setStatusMessage("Share image downloaded.");
    }
  }, [currentItem]);

  const handleSaveAction = useCallback(() => {
    if (currentItem) {
      void saveItem(currentItem);
    }
  }, [currentItem, saveItem]);

  const handleSkip = useCallback(() => {
    advance();
  }, [advance]);

  const emptyState = (
    <div className="rounded-3xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
      <p className="font-display text-xl text-foreground">No quotes to show</p>
      <p className="mt-2 text-sm text-muted">
        Check back soon or browse cards on the home page.
      </p>
      <Link
        href="/"
        className="mt-4 inline-block text-sm font-medium text-sage-dark hover:underline"
      >
        Browse cards
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <SwipeDeck
        item={currentItem}
        onAction={(action) => {
          if (action === "save") {
            handleSaveAction();
            return;
          }
          handleSkip();
        }}
        onTapAdvance={advance}
        emptyState={emptyState}
        reducedMotionFallback={
          currentItem ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-border bg-surface p-6 shadow-lg">
                <p className="font-display text-2xl leading-relaxed text-foreground">
                  &ldquo;{currentItem.text}&rdquo;
                </p>
                <p className="mt-4 text-sm font-medium text-muted">
                  {currentItem.attributed_to}
                </p>
                {currentItem.source_url ? (
                  <a
                    href={currentItem.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-sage-dark hover:underline"
                  >
                    Source
                  </a>
                ) : null}
              </div>
              <DeckActionBar
                onSkip={handleSkip}
                onSave={handleSaveAction}
                onShare={() => {
                  void handleShare();
                }}
                isSavePending={isSaving}
                isSaved={isFavorited("quote", currentItem.id)}
              />
            </div>
          ) : (
            emptyState
          )
        }
        renderCard={(item) => (
          <>
            <p className="font-display text-2xl leading-relaxed text-foreground">
              &ldquo;{item.text}&rdquo;
            </p>
            <p className="mt-4 text-sm font-medium text-muted">
              {item.attributed_to}
            </p>
            {item.source_url ? (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-sage-dark hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                Source
              </a>
            ) : null}
          </>
        )}
      />

      {currentItem ? (
        <DeckActionBar
          onSkip={handleSkip}
          onSave={handleSaveAction}
          onShare={() => {
            void handleShare();
          }}
          isSavePending={isSaving}
          isSaved={isFavorited("quote", currentItem.id)}
        />
      ) : null}

      <p className="text-center text-xs text-muted">
        Swipe right to save, left to skip. Tap the card to see the next one.
      </p>

      {isLoading ? (
        <p className="text-center text-xs text-muted">Loading more...</p>
      ) : null}
      {errorMessage ? (
        <p className="text-center text-xs text-warning-text" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {statusMessage ? (
        <p className="text-center text-xs text-sage-dark" role="status">
          {statusMessage}
        </p>
      ) : null}
      {index >= items.length && items.length > 0 ? (
        <p className="text-center text-sm text-muted">
          You reached the end. Saved quotes appear in{" "}
          <Link
            href="/account/saved"
            className="text-sage-dark hover:underline"
          >
            your saved list
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
