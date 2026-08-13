import { Skeleton } from "@/components/ui/skeleton";

export function NewsletterUnsubscribeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4 rounded-xl border border-border bg-surface p-6 text-center">
      <Skeleton className="mx-auto h-8 w-36" />
      <Skeleton className="mx-auto h-4 w-full max-w-sm" />
      <Skeleton className="mx-auto h-4 w-4/5 max-w-xs" />
    </div>
  );
}
