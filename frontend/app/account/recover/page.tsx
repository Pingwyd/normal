import { AccountRecoverForm } from "@/components/account/account-recover-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata = {
  title: "Recover account | Is it normal?",
  description: "Reset your password using a single-use recovery code.",
};

export default function AccountRecoverPage() {
  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <AccountRecoverForm />
      </main>
      <SiteFooter />
    </div>
  );
}
