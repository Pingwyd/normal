import { Suspense } from "react";

import { CategoryChips } from "@/components/browse/category-chips";
import { BrowseSectionLabel } from "@/components/browse/browse-section-label";
import { HeroSection } from "@/components/browse/hero-section";
import { LoadMoreButton } from "@/components/browse/load-more-button";
import { SearchBar } from "@/components/browse/search-bar";
import { CardFeedSkeleton } from "@/components/cards/card-feed-skeleton";
import { CardGrid } from "@/components/cards/card-grid";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchAccumulatedCards } from "@/lib/api/cards";
import { ApiRequestError } from "@/lib/api/errors";
import type {
  BrowseSearchParams,
  CardSummary,
  PaginationMeta,
} from "@/lib/api/types";
import { parseBrowseSearchParams } from "@/lib/browse-url";
import { BROWSE_CATEGORIES } from "@/lib/browse-categories";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type BrowseFeedResult =
  | { ok: true; cards: CardSummary[]; meta: PaginationMeta | null }
  | { ok: false; message: string };

async function loadBrowseFeed(
  browseParams: BrowseSearchParams,
): Promise<BrowseFeedResult> {
  try {
    const { cards, meta } = await fetchAccumulatedCards(browseParams);
    return { ok: true, cards, meta };
  } catch (error) {
    const message =
      error instanceof ApiRequestError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Something went wrong while loading cards.";

    return { ok: false, message };
  }
}

function BrowseFeedError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-warning-border bg-warning-surface px-6 py-8 text-center">
      <p className="font-display text-lg text-foreground">
        We could not load cards right now
      </p>
      <p className="mt-2 text-sm text-muted">{message}</p>
    </div>
  );
}

async function BrowseFeed({
  browseParams,
}: {
  browseParams: BrowseSearchParams;
}) {
  const result = await loadBrowseFeed(browseParams);

  if (!result.ok) {
    return <BrowseFeedError message={result.message} />;
  }

  return (
    <>
      <BrowseSectionLabel
        title={
          BROWSE_CATEGORIES.find(
            (category) => category.slug === browseParams.category,
          )?.name ?? "All cards"
        }
        meta={`${result.cards.length} card${result.cards.length === 1 ? "" : "s"}`}
      />
      <CardGrid cards={result.cards} />
      <LoadMoreButton browseParams={browseParams} meta={result.meta} />
    </>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const browseParams = parseBrowseSearchParams(resolvedSearchParams);

  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1100px] px-4 sm:px-7">
        <HeroSection />

        <section className="space-y-[34px]">
          <SearchBar
            key={browseParams.q ?? ""}
            initialQuery={browseParams.q ?? ""}
            browseParams={browseParams}
          />
          <CategoryChips browseParams={browseParams} />
        </section>

        <Suspense fallback={<CardFeedSkeleton />}>
          <BrowseFeed browseParams={browseParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
