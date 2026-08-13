import { Skeleton } from "@/components/ui/skeleton";

export function AdminLoginPageSkeleton() {
  return (
    <div className="min-h-full bg-background">
      <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-16 sm:px-6">
        <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-8 w-44" />
            <Skeleton className="mx-auto h-4 w-56" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <Skeleton className="h-11 w-full rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
