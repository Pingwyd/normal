import { PageLoadingShell } from "@/components/layout/page-loading-shell";
import { SuggestPageSkeleton } from "@/components/submissions/suggest-page-skeleton";

export default function SuggestLoading() {
  return (
    <PageLoadingShell>
      <SuggestPageSkeleton />
    </PageLoadingShell>
  );
}
