import { Skeleton } from "@/components/ui/skeleton";

export function CardFeedSkeleton() {
  return (
    <div className="card-feed-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-16 w-full" />
          <div className="mt-auto flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
