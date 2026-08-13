import { PageLoadingShell } from "@/components/layout/page-loading-shell";
import { SettingsPageSkeleton } from "@/components/settings/settings-page-skeleton";

export default function AccountSettingsLoading() {
  return (
    <PageLoadingShell mainClassName="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <SettingsPageSkeleton />
    </PageLoadingShell>
  );
}
