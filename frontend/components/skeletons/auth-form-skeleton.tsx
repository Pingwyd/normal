import { Skeleton } from "@/components/ui/skeleton";

type AuthFormSkeletonProps = {
  variant: "login" | "signup" | "recover";
};

export function AuthFormSkeleton({ variant }: AuthFormSkeletonProps) {
  const fieldCount = variant === "login" ? 2 : 4;

  return (
    <div className="mx-auto w-full max-w-xl space-y-5 rounded-xl border border-[#D8D5CC] bg-white p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {Array.from({ length: fieldCount }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}

      {variant === "signup" ? (
        <div className="flex items-start gap-3">
          <Skeleton className="mt-1 h-4 w-4 rounded" />
          <Skeleton className="h-10 flex-1" />
        </div>
      ) : null}

      <Skeleton className="h-11 w-full rounded-full" />

      <div className="space-y-2 pt-2">
        <Skeleton className="mx-auto h-4 w-48" />
        {variant === "recover" ? (
          <Skeleton className="mx-auto h-4 w-56" />
        ) : null}
      </div>
    </div>
  );
}
