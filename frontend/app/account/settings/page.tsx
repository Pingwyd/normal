import { AccountSettingsForm } from "@/components/account/account-settings-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function AccountSettingsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <AccountSettingsForm />
      </main>
      <SiteFooter />
    </>
  );
}
