"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { DeckActionBar } from "@/components/deck/deck-action-bar";
import { DeckStackFrame } from "@/components/deck/deck-stack-frame";
import { SwipeDeck } from "@/components/deck/swipe-deck";
import type { AffirmationSummary } from "@/lib/api/daily-content-types";
import { fetchAffirmationsPage } from "@/lib/affirmations/client-api";
import {
  renderShareImageDataUrl,
  shareDeckItem,
} from "@/lib/deck/share-export";
import { useDeckFeed } from "@/lib/deck/use-deck-feed";
import type { PaginationMeta } from "@/lib/api/types";
import { rememberFavoriteMetadata } from "@/lib/favorites/metadata-cache";

type AffirmationDeckViewProps = {
  initialItems: AffirmationSummary[];
  initialMeta: PaginationMeta | null;
  moodFilter?: string;
  tagFilter?: string;
};

export function AffirmationDeckView({
  initialItems,
  initialMeta,
  moodFilter,
  tagFilter,
}: AffirmationDeckViewProps) {
  const { isReady, isFavorited, toggleFavorite } = useFavorites();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPage = useCallback(
    async (after?: string) =>
      fetchAffirmationsPage({
        mood: moodFilter,
        tag: tagFilter,
        after,
      }),
    [moodFilter, tagFilter],
  );

  const { currentItem, advance, errorMessage, isLoading, items, index } =
    useDeckFeed({
      initialItems,
      initialMeta,
      fetchPage,
      getItemId: (item) => item.id,
    });

  const saveItem = useCallback(
    async (item: AffirmationSummary) => {
      if (!isReady || isSaving) {
        advance();
        return;
      }

      const alreadySaved = isFavorited("affirmation", item.id);
      if (alreadySaved) {
        advance();
        return;
      }

      setIsSaving(true);
      setStatusMessage(null);
      try {
        await toggleFavorite("affirmation", item.id);
        rememberFavoriteMetadata("affirmation", item.id, {
          question: item.text,
        });
        setStatusMessage("Saved to your list.");
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : "Could not save affirmation.",
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

    const url = `${window.location.origin}/share/affirmations/${currentItem.id}`;
    const imageDataUrl = renderShareImageDataUrl({
      title: "Affirmation",
      body: currentItem.text,
      footer: currentItem.tags.map((tag) => tag.name).join(", ") || undefined,
    });

    const result = await shareDeckItem({
      url,
      title: "Affirmation",
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
      <p className="font-display text-xl text-foreground">
        No affirmations to show
      </p>
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
      <DeckStackFrame hint="Swipe right to save, left to skip. Tap the card to see the next one.">
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
                  {currentItem.text}
                </p>
                {currentItem.tags.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {currentItem.tags.map((tag) => (
                      <li
                        key={tag.id}
                        className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-sage-dark"
                      >
                        {tag.name}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <DeckActionBar
                onSkip={handleSkip}
                onSave={handleSaveAction}
                onShare={() => {
                  void handleShare();
                }}
                isSavePending={isSaving}
                isSaved={isFavorited("affirmation", currentItem.id)}
              />
            </div>
          ) : (
            emptyState
          )
        }
        renderCard={(item) => (
          <>
            <p className="font-mono text-[10px] uppercase tracking-wide text-sage">
              Today&apos;s affirmation
            </p>
            <p className="mt-2.5 font-display text-[19px] leading-[1.4] text-foreground">
              {item.text}
            </p>
            {item.tags.length > 0 ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-sage-dark"
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      />
      </DeckStackFrame>

      {currentItem ? (
        <DeckActionBar
          onSkip={handleSkip}
          onSave={handleSaveAction}
          onShare={() => {
            void handleShare();
          }}
          isSavePending={isSaving}
          isSaved={isFavorited("affirmation", currentItem.id)}
        />
      ) : null}

      {isLoading ? (
        <p className="text-center text-xs text-white/60">Loading more...</p>
      ) : null}
      {errorMessage ? (
        <p className="text-center text-xs text-warning-text" role="alert">
          {errorMessage}
        </p>
      ) : null}
      {statusMessage ? (
        <p className="text-center text-xs text-accent" role="status">
          {statusMessage}
        </p>
      ) : null}
      {index >= items.length && items.length > 0 ? (
        <p className="text-center text-sm text-white/70">
          You reached the end. Saved affirmations appear in{" "}
          <Link
            href="/account/saved"
            className="text-accent hover:underline"
          >
            your saved list
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
