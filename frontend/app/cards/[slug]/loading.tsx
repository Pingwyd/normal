import { CardDetailPageSkeleton } from "@/components/cards/card-detail-page-skeleton";
import { PageLoadingShell } from "@/components/layout/page-loading-shell";

export default function CardDetailLoading() {
  return (
    <PageLoadingShell mainClassName="px-4 py-8 sm:px-6 sm:py-10">
      <CardDetailPageSkeleton />
    </PageLoadingShell>
  );
}
