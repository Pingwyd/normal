import { Suspense } from "react";

import { CategoryChips } from "@/components/browse/category-chips";
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
    <div className="rounded-xl border border-[#E8A97A] bg-white px-6 py-8 text-center">
      <p className="font-display text-lg text-[#202B26]">
        We could not load cards right now
      </p>
      <p className="mt-2 text-sm text-[#5A6560]">{message}</p>
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
      <CardGrid cards={result.cards} />
      <LoadMoreButton browseParams={browseParams} meta={result.meta} />
    </>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const browseParams = parseBrowseSearchParams(resolvedSearchParams);

  return (
    <div className="min-h-full bg-[#F2F1EC]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-8">
          <section className="space-y-3">
            <h1 className="font-display text-3xl text-[#202B26] sm:text-4xl">
              Browse common worries
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[#5A6560]">
              Search and filter cards about everyday experiences. If something
              is not typical, the answer will say so plainly.
            </p>
          </section>

          <section className="space-y-4">
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
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
