import { AccountFormPageSkeleton } from "@/components/account/account-form-page-skeleton";
import { PageLoadingShell } from "@/components/layout/page-loading-shell";

export default function AccountLoading() {
  return (
    <PageLoadingShell>
      <AccountFormPageSkeleton />
    </PageLoadingShell>
  );
}
