import { AccountLoginForm } from "@/components/account/account-login-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata = {
  title: "Sign in | Is it normal?",
  description: "Sign in to sync saved cards across devices.",
};

export default function AccountLoginPage() {
  return (
    <div className="min-h-full bg-[#F2F1EC]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <AccountLoginForm />
      </main>
      <SiteFooter />
    </div>
  );
}
