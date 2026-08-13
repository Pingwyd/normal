import { Skeleton } from "@/components/ui/skeleton";

type AdminListPageSkeletonProps = {
  variant:
    "cards" | "affirmations" | "quotes" | "submissions" | "issues" | "due";
};

const FILTER_COUNTS: Record<AdminListPageSkeletonProps["variant"], number> = {
  cards: 4,
  affirmations: 3,
  quotes: 3,
  submissions: 5,
  issues: 4,
  due: 3,
};

export function AdminListPageSkeleton({ variant }: AdminListPageSkeletonProps) {
  const filterCount = FILTER_COUNTS[variant];
  const showCreateButton =
    variant === "affirmations" || variant === "quotes" || variant === "cards";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        {showCreateButton ? (
          <Skeleton className="h-10 w-36 rounded-full" />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: filterCount }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index} className="px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-full max-w-xl" />
                {variant === "cards" || variant === "due" ? (
                  <Skeleton className="h-4 w-2/3 max-w-md" />
                ) : null}
                {variant === "quotes" ? (
                  <Skeleton className="h-4 w-40" />
                ) : null}
                {variant === "submissions" || variant === "issues" ? (
                  <Skeleton className="h-3 w-32" />
                ) : null}
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
