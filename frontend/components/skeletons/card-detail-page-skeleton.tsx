import { Skeleton } from "@/components/ui/skeleton";

import { PublicPageShell } from "./public-page-shell";

export function CardDetailPageSkeleton() {
  return (
    <PublicPageShell>
      <article className="mx-auto w-full max-w-3xl space-y-10">
        <Skeleton className="h-4 w-32" />

        <header className="space-y-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-full sm:h-11" />
          <Skeleton className="h-10 w-full sm:h-11" />
          <Skeleton className="h-6 w-2/3" />
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </header>

        <div className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-4/5" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </div>

        <div className="border-t border-[#ECEAE4] pt-6">
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>
      </article>
    </PublicPageShell>
  );
}
