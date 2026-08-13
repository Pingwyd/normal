import { Skeleton } from "@/components/ui/skeleton";

export function SavedListSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-3 h-6 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function SavedPageSkeleton() {
  return (
    <>
      <section className="mx-auto mb-8 max-w-2xl space-y-3 text-center">
        <Skeleton className="mx-auto h-10 w-48 max-w-full" />
        <Skeleton className="mx-auto h-4 w-full max-w-lg" />
        <Skeleton className="mx-auto h-4 w-4/5 max-w-md" />
      </section>

      <SavedListSkeleton />
    </>
  );
}
