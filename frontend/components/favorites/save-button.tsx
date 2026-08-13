"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import type { FavoriteContentType } from "@/lib/favorites/keys";
import {
  forgetFavoriteMetadata,
  rememberFavoriteMetadata,
} from "@/lib/favorites/metadata-cache";

type SaveButtonProps = {
  contentType: FavoriteContentType;
  contentId: string;
  label?: string;
  cardSlug?: string;
  cardQuestion?: string;
  className?: string;
};

export function SaveButton({
  contentType,
  contentId,
  label = "card",
  cardSlug,
  cardQuestion,
  className = "",
}: SaveButtonProps) {
  const { isReady, isFavorited, toggleFavorite } = useFavorites();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saved = isFavorited(contentType, contentId);

  async function handleToggle() {
    if (isPending) {
      return;
    }

    setErrorMessage(null);
    setIsPending(true);
    try {
      const nextFavorited = !saved;
      await toggleFavorite(contentType, contentId);
      if (nextFavorited) {
        rememberFavoriteMetadata(contentType, contentId, {
          slug: cardSlug,
          question: cardQuestion ?? label,
        });
      } else {
        forgetFavoriteMetadata(contentType, contentId);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not update saved state.";
      setErrorMessage(message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => {
          void handleToggle();
        }}
        disabled={!isReady || isPending}
        aria-pressed={saved}
        aria-label={
          saved ? `Remove saved ${label}` : `Save ${label} to your device`
        }
        className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-[#33473D] transition-colors hover:border-[#D8D5CC] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Bookmark
          size={14}
          aria-hidden="true"
          className={saved ? "fill-current text-[#33473D]" : "text-[#5A6560]"}
        />
        <span className="text-xs font-medium">{saved ? "Saved" : "Save"}</span>
      </button>
      {errorMessage ? (
        <span className="text-xs text-[#8A4B2A]" role="alert">
          {errorMessage}
        </span>
      ) : null}
    </span>
  );
}
