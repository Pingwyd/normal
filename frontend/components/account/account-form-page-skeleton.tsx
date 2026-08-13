import { Skeleton } from "@/components/ui/skeleton";

type AccountFormPageSkeletonProps = {
  fieldCount?: number;
};

export function AccountFormPageSkeleton({
  fieldCount = 2,
}: AccountFormPageSkeletonProps) {
  return (
    <div className="mx-auto w-full max-w-xl space-y-5 rounded-xl border border-border bg-surface p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {Array.from({ length: fieldCount }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}

      <Skeleton className="h-10 w-full rounded-full" />
      <Skeleton className="mx-auto h-4 w-48" />
    </div>
  );
}
