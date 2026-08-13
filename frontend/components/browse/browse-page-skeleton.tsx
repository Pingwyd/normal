import { CardFeedSkeleton } from "@/components/cards/card-feed-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function BrowsePageSkeleton() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <Skeleton className="h-10 w-72 max-w-full sm:h-11" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </section>

      <section className="space-y-4">
        <Skeleton className="h-12 w-full max-w-xl rounded-full" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </section>

      <CardFeedSkeleton />
    </div>
  );
}
