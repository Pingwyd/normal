import { Skeleton } from "@/components/ui/skeleton";

export function SuggestPageSkeleton() {
  return (
    <div className="space-y-8">
      <section className="mx-auto max-w-2xl space-y-3 text-center">
        <Skeleton className="mx-auto h-10 w-56 max-w-full" />
        <Skeleton className="mx-auto h-4 w-full max-w-xl" />
        <Skeleton className="mx-auto h-4 w-5/6 max-w-lg" />
      </section>

      <div className="mx-auto w-full max-w-xl space-y-5 rounded-xl border border-border bg-surface p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}
