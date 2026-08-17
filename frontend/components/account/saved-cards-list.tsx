"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { SavedListSkeleton } from "@/components/account/saved-page-skeleton";
import { useFavorites } from "@/components/favorites/favorites-provider";
import { clearAccountSession } from "@/lib/account/session-client";
import type {
  FavoriteAffirmationContent,
  FavoriteCardContent,
  FavoriteListItem,
  FavoriteQuoteContent,
} from "@/lib/api/account-types";
import { fetchAccountFavorites } from "@/lib/favorites/client-api";
import type { FavoriteContentType } from "@/lib/favorites/keys";
import type { LocalFavoriteItem } from "@/lib/favorites/local-storage";
import { readFavoriteMetadata } from "@/lib/favorites/metadata-cache";

type SavedTab = "cards" | "affirmations" | "quotes";

type SavedTabConfig = {
  value: SavedTab;
  label: string;
  contentType: FavoriteContentType;
  browseHref: string;
  browseLabel: string;
  emptyTitle: string;
  emptyDescription: string;
};

const SAVED_TABS: SavedTabConfig[] = [
  {
    value: "cards",
    label: "Cards",
    contentType: "card",
    browseHref: "/",
    browseLabel: "Browse cards",
    emptyTitle: "No saved cards yet",
    emptyDescription: "Save cards from the home feed to revisit them here.",
  },
  {
    value: "affirmations",
    label: "Affirmations",
    contentType: "affirmation",
    browseHref: "/affirmations",
    browseLabel: "Browse affirmations",
    emptyTitle: "No saved affirmations yet",
    emptyDescription: "Save affirmations from the deck to keep them here.",
  },
  {
    value: "quotes",
    label: "Quotes",
    contentType: "quote",
    browseHref: "/quotes",
    browseLabel: "Browse quotes",
    emptyTitle: "No saved quotes yet",
    emptyDescription: "Save quotes from the deck to keep them here.",
  },
];

function parseSavedTab(value: string | null): SavedTab {
  if (value === "affirmations" || value === "quotes") {
    return value;
  }
  return "cards";
}

function savedTabHref(tab: SavedTab): string {
  return tab === "cards" ? "/account/saved" : `/account/saved?tab=${tab}`;
}

function getTabConfig(tab: SavedTab): SavedTabConfig {
  return SAVED_TABS.find((entry) => entry.value === tab) ?? SAVED_TABS[0];
}

function savedItemHref(
  contentType: FavoriteContentType,
  contentId: string,
  slug?: string,
): string {
  if (contentType === "card" && slug) {
    return `/cards/${slug}`;
  }
  if (contentType === "affirmation") {
    return `/share/affirmations/${contentId}`;
  }
  if (contentType === "quote") {
    return `/share/quotes/${contentId}`;
  }
  return "/";
}

function SavedItemsTabs({ activeTab }: { activeTab: SavedTab }) {
  return (
    <div
      className="flex flex-wrap justify-center gap-2"
      role="tablist"
      aria-label="Saved item types"
    >
      {SAVED_TABS.map((tab) => {
        const isActive = tab.value === activeTab;
        return (
          <Link
            key={tab.value}
            href={savedTabHref(tab.value)}
            role="tab"
            aria-selected={isActive}
            className={`rounded-full px-4 py-2 text-sm font-medium ${
              isActive
                ? "bg-sage-dark text-white"
                : "border border-border-strong bg-surface text-sage-dark"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function SavedUnavailablePreview({
  contentType,
}: {
  contentType: FavoriteContentType;
}) {
  const labels: Record<FavoriteContentType, string> = {
    card: "card",
    affirmation: "affirmation",
    quote: "quote",
  };

  return (
    <article className="rounded-3xl border border-dashed border-border-strong bg-surface-muted p-6">
      <div className="flex items-start gap-3">
        <AlertCircle
          size={20}
          className="mt-0.5 shrink-0 text-muted"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <h2 className="font-display text-lg text-foreground">
            No longer available
          </h2>
          <p className="text-sm text-muted">
            This saved {labels[contentType]} is not on the public site right
            now. It will reappear here if it is published again.
          </p>
        </div>
      </div>
    </article>
  );
}

function SavedCardPreview({
  contentId,
  content,
  metadataSlug,
}: {
  contentId: string;
  content?: FavoriteCardContent;
  metadataSlug?: string;
}) {
  const slug = content?.slug ?? metadataSlug;
  const href = savedItemHref("card", contentId, slug);
  const categoryName = content?.category.name;
  const question = content?.question ?? "Saved card";
  const brief = content?.brief;

  return (
    <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
      <Link href={href} className="block space-y-3">
        {categoryName ? (
          <p className="font-mono text-xs uppercase tracking-wide text-sage">
            {categoryName}
          </p>
        ) : null}
        <h2 className="font-display text-2xl leading-snug text-foreground">
          {question}
        </h2>
        {brief ? (
          <p className="text-sm leading-relaxed text-ink-secondary">{brief}</p>
        ) : null}
      </Link>
      {!slug ? (
        <p className="mt-3 text-xs text-muted">
          Open from browse if this card was saved on another device.
        </p>
      ) : null}
    </article>
  );
}

function SavedAffirmationPreview({
  contentId,
  content,
  fallbackText,
}: {
  contentId: string;
  content?: FavoriteAffirmationContent;
  fallbackText?: string;
}) {
  const text = content?.text ?? fallbackText ?? "Saved affirmation";
  const tags = content?.tags ?? [];

  return (
    <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
      <Link href={savedItemHref("affirmation", contentId)} className="block">
        <p className="font-display text-2xl leading-relaxed text-foreground">
          {text}
        </p>
        {tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-sage-dark"
              >
                {tag.name}
              </li>
            ))}
          </ul>
        ) : null}
      </Link>
    </article>
  );
}

function SavedQuotePreview({
  contentId,
  content,
  fallbackText,
}: {
  contentId: string;
  content?: FavoriteQuoteContent;
  fallbackText?: string;
}) {
  const text = content?.text ?? fallbackText ?? "Saved quote";
  const attributedTo = content?.attributed_to;
  const sourceUrl = content?.source_url;

  return (
    <article className="rounded-3xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
      <Link href={savedItemHref("quote", contentId)} className="block">
        <p className="font-display text-2xl leading-relaxed text-foreground">
          &ldquo;{text}&rdquo;
        </p>
        {attributedTo ? (
          <p className="mt-4 text-sm font-medium text-muted">{attributedTo}</p>
        ) : null}
      </Link>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-sage-dark hover:underline"
        >
          Source
        </a>
      ) : null}
    </article>
  );
}

function SavedFavoritePreview({ favorite }: { favorite: FavoriteListItem }) {
  if (!favorite.available) {
    return <SavedUnavailablePreview contentType={favorite.content_type} />;
  }

  if (favorite.content_type === "card") {
    return (
      <SavedCardPreview
        contentId={favorite.content_id}
        content={favorite.content as FavoriteCardContent}
      />
    );
  }

  if (favorite.content === null) {
    return <SavedUnavailablePreview contentType={favorite.content_type} />;
  }

  if (favorite.content_type === "affirmation") {
    return (
      <SavedAffirmationPreview
        contentId={favorite.content_id}
        content={favorite.content as FavoriteAffirmationContent}
      />
    );
  }

  return (
    <SavedQuotePreview
      contentId={favorite.content_id}
      content={favorite.content as FavoriteQuoteContent}
    />
  );
}

function SavedLocalPreview({ favorite }: { favorite: LocalFavoriteItem }) {
  const metadata = readFavoriteMetadata(
    favorite.content_type,
    favorite.content_id,
  );

  if (favorite.content_type === "card") {
    return (
      <SavedCardPreview
        contentId={favorite.content_id}
        metadataSlug={metadata?.slug}
        content={
          metadata?.question
            ? {
                question: metadata.question,
                slug: metadata.slug ?? "",
                brief: "",
                category: { name: "", slug: "" },
              }
            : undefined
        }
      />
    );
  }

  if (favorite.content_type === "affirmation") {
    return (
      <SavedAffirmationPreview
        contentId={favorite.content_id}
        fallbackText={metadata?.question}
      />
    );
  }

  return (
    <SavedQuotePreview
      contentId={favorite.content_id}
      fallbackText={metadata?.question}
    />
  );
}

function SavedTabEmptyState({ tab }: { tab: SavedTabConfig }) {
  return (
    <div className="space-y-3 rounded-xl border border-dashed border-border-strong bg-surface p-6 text-center">
      <p className="font-display text-lg text-foreground">{tab.emptyTitle}</p>
      <p className="text-sm text-muted">{tab.emptyDescription}</p>
      <Link
        href={tab.browseHref}
        className="inline-block text-sm font-medium text-sage-dark hover:underline"
      >
        {tab.browseLabel}
      </Link>
    </div>
  );
}

function SavedGlobalEmptyState() {
  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-6 text-center">
      <p className="font-display text-lg text-foreground">
        No saved items on this device
      </p>
      <p className="text-sm text-muted">
        Save cards, affirmations, or quotes to keep them here locally, or sign
        in to sync across devices.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full border border-sage-dark bg-surface px-4 py-2 text-sm font-medium text-sage-dark"
        >
          Browse cards
        </Link>
        <Link
          href="/account/login"
          className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export function SavedCardsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseSavedTab(searchParams.get("tab"));
  const tabConfig = getTabConfig(activeTab);
  const {
    accountId,
    isReady,
    clearAuthenticatedSession,
    readLocalFavoritesForMerge,
  } = useFavorites();
  const [favorites, setFavorites] = useState<FavoriteListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const localFavorites = readLocalFavoritesForMerge().filter(
    (favorite) => favorite.content_type === tabConfig.contentType,
  );
  const allLocalFavorites = readLocalFavoritesForMerge();

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
        const items = await fetchAccountFavorites(tabConfig.contentType);
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
  }, [accountId, isReady, tabConfig.contentType]);

  if (!isReady || (accountId && isLoading)) {
    return (
      <div className="space-y-6">
        <SavedItemsTabs activeTab={activeTab} />
        <SavedListSkeleton />
      </div>
    );
  }

  if (!accountId) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <SavedItemsTabs activeTab={activeTab} />

        {allLocalFavorites.length === 0 ? (
          <SavedGlobalEmptyState />
        ) : (
          <>
            <p className="text-sm text-muted">
              Saved on this device only.{" "}
              <Link
                href="/account/signup"
                className="text-sage-dark hover:underline"
              >
                Create an account
              </Link>{" "}
              to sync across devices.
            </p>

            <div role="tabpanel" aria-label={tabConfig.label}>
              {localFavorites.length === 0 ? (
                <SavedTabEmptyState tab={tabConfig} />
              ) : (
                <ul className="space-y-4">
                  {localFavorites.map((favorite) => (
                    <li key={`${favorite.content_type}:${favorite.content_id}`}>
                      <SavedLocalPreview favorite={favorite} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <SavedItemsTabs activeTab={activeTab} />
        <div className="rounded-xl border border-warning-border bg-warning-surface p-6">
          <p className="text-sm text-foreground" role="alert">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <SavedItemsTabs activeTab={activeTab} />

      <div role="tabpanel" aria-label={tabConfig.label}>
        {favorites.length === 0 ? (
          <SavedTabEmptyState tab={tabConfig} />
        ) : (
          <ul className="space-y-4">
            {favorites.map((favorite) => (
              <li key={favorite.id}>
                <SavedFavoritePreview favorite={favorite} />
              </li>
            ))}
          </ul>
        )}
      </div>

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
        className="rounded-full border border-sage-dark bg-surface px-4 py-2 text-sm font-medium text-sage-dark"
      >
        Sign out
      </button>
    </div>
  );
}
