import { BrowsePageSkeleton } from "@/components/browse/browse-page-skeleton";
import { PageLoadingShell } from "@/components/layout/page-loading-shell";

export default function HomeLoading() {
  return (
    <PageLoadingShell>
      <BrowsePageSkeleton />
    </PageLoadingShell>
  );
}
