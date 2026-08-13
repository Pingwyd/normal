import { Skeleton } from "@/components/ui/skeleton";

export function CardDetailPageSkeleton() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-10">
      <Skeleton className="h-4 w-32" />

      <header className="space-y-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-6 w-full max-w-2xl" />
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </header>

      <div className="space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>

      <div className="space-y-3 border-t border-border-subtle pt-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    </article>
  );
}
