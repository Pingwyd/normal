"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useFavorites } from "@/components/favorites/favorites-provider";
import { clearAccountSession } from "@/lib/account/session-client";
import type { FavoriteItem } from "@/lib/api/account-types";
import { fetchAccountFavorites } from "@/lib/favorites/client-api";
import { readFavoriteMetadata } from "@/lib/favorites/metadata-cache";

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
          setFavorites(items.filter((item) => item.content_type === "card"));
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load saved cards.",
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
        <p className="text-sm text-[#5A6560]">Loading saved cards...</p>
      </div>
    );
  }

  if (!accountId) {
    const localFavorites = readLocalFavoritesForMerge().filter(
      (item) => item.content_type === "card",
    );

    if (localFavorites.length === 0) {
      return (
        <div className="mx-auto w-full max-w-2xl space-y-4 rounded-xl border border-[#D8D5CC] bg-white p-6 text-center">
          <p className="font-display text-lg text-[#202B26]">
            No saved cards on this device
          </p>
          <p className="text-sm text-[#5A6560]">
            Tap Save on any card to keep it here locally, or sign in to sync
            across devices.
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
            const title = metadata?.question ?? "Saved card";
            const href = metadata?.slug ? `/cards/${metadata.slug}` : "/";

            return (
              <li
                key={`${favorite.content_type}:${favorite.content_id}`}
                className="rounded-xl border border-[#D8D5CC] bg-white p-4 shadow-sm"
              >
                <Link
                  href={href}
                  className="font-display text-lg text-[#202B26] hover:text-[#4B6B5E]"
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
          No saved cards yet
        </p>
        <p className="text-sm text-[#5A6560]">
          Tap Save on any card to add it here.
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-[#33473D] hover:underline"
        >
          Browse cards
        </Link>
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
          const title = metadata?.question ?? "Saved card";
          const href = metadata?.slug ? `/cards/${metadata.slug}` : "/";

          return (
            <li
              key={favorite.id}
              className="rounded-xl border border-[#D8D5CC] bg-white p-4 shadow-sm"
            >
              <Link
                href={href}
                className="font-display text-lg text-[#202B26] hover:text-[#4B6B5E]"
              >
                {title}
              </Link>
              {!metadata?.slug ? (
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
