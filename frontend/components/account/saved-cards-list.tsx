"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { clearAccountSession } from "@/lib/account/session-client";
import type { FavoriteItem } from "@/lib/api/account-types";
import { fetchAccountFavorites } from "@/lib/favorites/client-api";
import type { FavoriteContentType } from "@/lib/favorites/keys";
import { readFavoriteMetadata } from "@/lib/favorites/metadata-cache";

function savedItemHref(
  contentType: FavoriteContentType,
  contentId: string,
  metadata: ReturnType<typeof readFavoriteMetadata>,
): string {
  if (contentType === "card" && metadata?.slug) {
    return `/cards/${metadata.slug}`;
  }
  if (contentType === "affirmation") {
    return `/share/affirmations/${contentId}`;
  }
  if (contentType === "quote") {
    return `/share/quotes/${contentId}`;
  }
  return "/";
}

function savedItemLabel(
  contentType: FavoriteContentType,
  metadata: ReturnType<typeof readFavoriteMetadata>,
): string {
  if (metadata?.question) {
    return metadata.question;
  }
  if (contentType === "affirmation") {
    return "Saved affirmation";
  }
  if (contentType === "quote") {
    return "Saved quote";
  }
  return "Saved card";
}

function savedItemTypeLabel(contentType: FavoriteContentType): string {
  if (contentType === "affirmation") {
    return "Affirmation";
  }
  if (contentType === "quote") {
    return "Quote";
  }
  return "Card";
}

export function SavedCardsList() {
  const router = useRouter();
  const {
    accountId,
    isReady,
    clearAuthenticatedSession,
    readLocalFavoritesForMerge,
  } = useFavorites();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      if (!isReady) {
        return;
      }

      if (!accountId) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      try {
        const items = await fetchAccountFavorites();
        if (!cancelled) {
          setFavorites(items);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load saved items.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [accountId, isReady]);

  if (!isReady || isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-[#D8D5CC] bg-white p-6">
        <p className="text-sm text-[#5A6560]">Loading saved items...</p>
      </div>
    );
  }

  if (!accountId) {
    const localFavorites = readLocalFavoritesForMerge();

    if (localFavorites.length === 0) {
      return (
        <div className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-[#D8D5CC] bg-white p-6 text-center">
          <p className="font-display text-lg text-[#202B26]">
            No saved items on this device
          </p>
          <p className="text-sm text-[#5A6560]">
            Save cards, affirmations, or quotes to keep them here locally, or
            sign in to sync across devices.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#33473D] bg-white px-4 py-2 text-sm font-medium text-[#33473D]"
            >
              Browse cards
            </Link>
            <Link
              href="/account/login"
              className="rounded-full bg-[#33473D] px-4 py-2 text-sm font-medium text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto w-full max-w-2xl space-y-4">
        <p className="text-sm text-[#5A6560]">
          Saved on this device only.{" "}
          <Link
            href="/account/signup"
            className="text-[#33473D] hover:underline"
          >
            Create an account
          </Link>{" "}
          to sync across devices.
        </p>
        <ul className="space-y-3">
          {localFavorites.map((favorite) => {
            const metadata = readFavoriteMetadata(
              favorite.content_type,
              favorite.content_id,
            );
            const title = savedItemLabel(favorite.content_type, metadata);
            const href = savedItemHref(
              favorite.content_type,
              favorite.content_id,
              metadata,
            );

            return (
              <li
                key={`${favorite.content_type}:${favorite.content_id}`}
                className="rounded-xl border border-[#D8D5CC] bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[#4B6B5E]">
                  {savedItemTypeLabel(favorite.content_type)}
                </p>
                <Link
                  href={href}
                  className="mt-1 block font-display text-lg text-[#202B26] hover:text-[#4B6B5E]"
                >
                  {title}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-[#E8A97A] bg-[#FFF7F0] p-6">
        <p className="text-sm text-[#202B26]" role="alert">
          {errorMessage}
        </p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-3 rounded-xl border border-dashed border-[#CFCBC2] bg-white p-6 text-center">
        <p className="font-display text-lg text-[#202B26]">
          No saved items yet
        </p>
        <p className="text-sm text-[#5A6560]">
          Save cards, affirmations, or quotes to add them here.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-[#33473D] hover:underline"
          >
            Browse cards
          </Link>
          <Link
            href="/affirmations"
            className="text-sm font-medium text-[#33473D] hover:underline"
          >
            Affirmations
          </Link>
          <Link
            href="/quotes"
            className="text-sm font-medium text-[#33473D] hover:underline"
          >
            Quotes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <ul className="space-y-3">
        {favorites.map((favorite) => {
          const metadata = readFavoriteMetadata(
            favorite.content_type,
            favorite.content_id,
          );
          const title = savedItemLabel(favorite.content_type, metadata);
          const href = savedItemHref(
            favorite.content_type,
            favorite.content_id,
            metadata,
          );

          return (
            <li
              key={favorite.id}
              className="rounded-xl border border-[#D8D5CC] bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4B6B5E]">
                {savedItemTypeLabel(favorite.content_type)}
              </p>
              <Link
                href={href}
                className="mt-1 block font-display text-lg text-[#202B26] hover:text-[#4B6B5E]"
              >
                {title}
              </Link>
              {favorite.content_type === "card" && !metadata?.slug ? (
                <p className="mt-1 text-xs text-[#5A6560]">
                  Open from browse if this card was saved on another device.
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => {
          void (async () => {
            await clearAccountSession();
            clearAuthenticatedSession();
            router.push("/account/login");
            router.refresh();
          })();
        }}
        className="rounded-full border border-[#33473D] bg-white px-4 py-2 text-sm font-medium text-[#33473D]"
      >
        Sign out
      </button>
    </div>
  );
}
