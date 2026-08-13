import { PageLoadingShell } from "@/components/layout/page-loading-shell";
import { ShareContentPageSkeleton } from "@/components/share/share-content-page-skeleton";

export default function Loading() {
  return (
    <PageLoadingShell>
      <ShareContentPageSkeleton variant="affirmation" />
    </PageLoadingShell>
  );
}
