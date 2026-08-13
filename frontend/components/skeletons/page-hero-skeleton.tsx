import { Skeleton } from "@/components/ui/skeleton";

type PageHeroSkeletonProps = {
  centered?: boolean;
  maxWidthClass?: string;
};

export function PageHeroSkeleton({
  centered = false,
  maxWidthClass = "max-w-2xl",
}: PageHeroSkeletonProps) {
  return (
    <section
      className={`space-y-3 ${centered ? "mx-auto text-center" : ""} ${maxWidthClass}`}
    >
      <Skeleton className={`h-10 ${centered ? "mx-auto" : ""} w-64 sm:h-11`} />
      <Skeleton className={`h-4 w-full ${centered ? "mx-auto" : ""}`} />
      <Skeleton
        className={`h-4 w-5/6 ${centered ? "mx-auto" : ""} ${centered ? "" : "max-w-xl"}`}
      />
    </section>
  );
}
