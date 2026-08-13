import { AccountFormPageSkeleton } from "@/components/account/account-form-page-skeleton";
import { PageLoadingShell } from "@/components/layout/page-loading-shell";

export default function AccountSignupLoading() {
  return (
    <PageLoadingShell>
      <AccountFormPageSkeleton fieldCount={3} />
    </PageLoadingShell>
  );
}
