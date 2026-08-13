import { Skeleton } from "@/components/ui/skeleton";

import { PageHeroSkeleton } from "./page-hero-skeleton";
import { PublicPageShell } from "./public-page-shell";

export function SavedListPageSkeleton() {
  return (
    <PublicPageShell>
      <PageHeroSkeleton centered maxWidthClass="mx-auto mb-8 max-w-2xl" />

      <div className="mx-auto w-full max-w-2xl space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-[#D8D5CC] bg-white p-4 shadow-sm"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </PublicPageShell>
  );
}
