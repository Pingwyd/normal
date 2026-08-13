import { Skeleton } from "@/components/ui/skeleton";

export function AdminInsightsPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-[#D8D5CC] bg-white p-5"
          >
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 5 }).map((__, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center justify-between gap-3"
              >
                <Skeleton className="h-4 w-full max-w-sm" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[#D8D5CC] bg-white p-5">
        <Skeleton className="mb-4 h-6 w-48" />
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className="mb-3 flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
