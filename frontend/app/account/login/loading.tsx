import { AccountFormPageSkeleton } from "@/components/account/account-form-page-skeleton";
import { PageLoadingShell } from "@/components/layout/page-loading-shell";

export default function AccountLoginLoading() {
  return (
    <PageLoadingShell>
      <AccountFormPageSkeleton fieldCount={2} />
    </PageLoadingShell>
  );
}
