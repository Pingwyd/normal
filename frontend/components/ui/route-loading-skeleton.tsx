import { Skeleton } from "@/components/ui/skeleton";

export function RouteLoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <Skeleton className="h-10 w-64 max-w-full" />
      <Skeleton className="h-4 w-full max-w-2xl" />
      <Skeleton className="h-12 w-full max-w-xl rounded-lg" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}
