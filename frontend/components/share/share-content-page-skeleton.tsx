import { Skeleton } from "@/components/ui/skeleton";

type ShareContentPageSkeletonProps = {
  variant: "affirmation" | "quote";
};

export function ShareContentPageSkeleton({
  variant,
}: ShareContentPageSkeletonProps) {
  return (
    <article className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-8 shadow-lg">
      <Skeleton className="h-3 w-24" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-full" />
        <Skeleton className="h-7 w-4/5" />
      </div>
      {variant === "affirmation" ? (
        <div className="mt-6 flex flex-wrap gap-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-16" />
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Skeleton className="h-10 w-40 rounded-full" />
        <Skeleton className="h-10 w-20 rounded-full" />
      </div>
    </article>
  );
}
