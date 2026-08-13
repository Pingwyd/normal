import { Skeleton } from "@/components/ui/skeleton";

import { PageHeroSkeleton } from "./page-hero-skeleton";
import { PublicPageShell } from "./public-page-shell";

type DeckPageSkeletonProps = {
  variant: "affirmation" | "quote";
};

export function DeckPageSkeleton({ variant }: DeckPageSkeletonProps) {
  const showTags = variant === "affirmation";

  return (
    <PublicPageShell>
      <PageHeroSkeleton centered maxWidthClass="mx-auto mb-8 max-w-md" />

      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="relative rounded-3xl border border-[#D8D5CC] bg-white p-6 shadow-lg">
          <Skeleton className="absolute left-6 top-6 h-6 w-14 rounded-full" />
          <Skeleton className="absolute right-6 top-6 h-6 w-14 rounded-full" />
          <div className="space-y-3 pt-8">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-7 w-11/12" />
            <Skeleton className="h-7 w-4/5" />
          </div>
          {showTags ? (
            <div className="mt-6 flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-16" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>

        <Skeleton className="mx-auto h-3 w-72" />
      </div>
    </PublicPageShell>
  );
}
