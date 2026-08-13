import { Skeleton } from "@/components/ui/skeleton";

export function SavedListItemsSkeleton() {
  return (
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
  );
}
