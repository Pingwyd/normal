import { Skeleton } from "@/components/ui/skeleton";

export function DeckPageSkeleton() {
  return (
    <>
      <section className="mx-auto mb-8 max-w-md space-y-3 text-center">
        <Skeleton className="mx-auto h-10 w-48 max-w-full" />
        <Skeleton className="mx-auto h-4 w-full max-w-sm" />
        <Skeleton className="mx-auto h-4 w-4/5 max-w-xs" />
      </section>

      <div className="mx-auto max-w-md space-y-6">
        <Skeleton className="h-[22rem] w-full rounded-xl" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      </div>
    </>
  );
}
