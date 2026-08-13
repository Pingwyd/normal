import { DeckPageSkeleton } from "@/components/deck/deck-page-skeleton";
import { PageLoadingShell } from "@/components/layout/page-loading-shell";

export default function QuotesLoading() {
  return (
    <PageLoadingShell>
      <DeckPageSkeleton />
    </PageLoadingShell>
  );
}
