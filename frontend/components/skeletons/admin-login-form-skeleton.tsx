import { Skeleton } from "@/components/ui/skeleton";

export function AdminLoginFormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
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
  );
}
