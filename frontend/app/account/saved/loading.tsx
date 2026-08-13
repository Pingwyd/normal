import { SavedPageSkeleton } from "@/components/account/saved-page-skeleton";
import { PageLoadingShell } from "@/components/layout/page-loading-shell";

export default function AccountSavedLoading() {
  return (
    <PageLoadingShell>
      <SavedPageSkeleton />
    </PageLoadingShell>
  );
}
