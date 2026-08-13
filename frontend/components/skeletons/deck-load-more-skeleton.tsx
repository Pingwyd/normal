import { Skeleton } from "@/components/ui/skeleton";

export function DeckLoadMoreSkeleton() {
  return (
    <div className="flex justify-center pt-1" aria-hidden="true">
      <Skeleton className="h-3 w-32" />
    </div>
  );
}
