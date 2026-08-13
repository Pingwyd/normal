import { CardFeedSkeleton } from "@/components/cards/card-feed-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

import { PageHeroSkeleton } from "./page-hero-skeleton";
import { PublicPageShell } from "./public-page-shell";

export function BrowsePageSkeleton() {
  return (
    <PublicPageShell>
      <div className="space-y-8">
        <PageHeroSkeleton maxWidthClass="max-w-2xl" />

        <section className="space-y-4">
          <Skeleton className="h-11 w-full max-w-xl rounded-full" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </section>

        <CardFeedSkeleton />
      </div>
    </PublicPageShell>
  );
}
