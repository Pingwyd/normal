import { Skeleton } from "@/components/ui/skeleton";

import { PageHeroSkeleton } from "./page-hero-skeleton";
import { PublicPageShell } from "./public-page-shell";

export function SuggestPageSkeleton() {
  return (
    <PublicPageShell>
      <div className="space-y-8">
        <PageHeroSkeleton centered maxWidthClass="mx-auto max-w-2xl" />

        <div className="mx-auto w-full max-w-2xl space-y-5 rounded-xl border border-[#D8D5CC] bg-white p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    </PublicPageShell>
  );
}
