import { Skeleton } from "@/components/ui/skeleton";

export function SettingsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-8 rounded-xl border border-border bg-surface p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>
      </div>
      <div className="space-y-3 border-t border-border pt-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-10 w-52 rounded-full" />
      </div>
      <div className="space-y-3 border-t border-border pt-6">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-48 rounded-full" />
      </div>
    </div>
  );
}
