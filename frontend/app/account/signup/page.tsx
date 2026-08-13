import { AccountSignupForm } from "@/components/account/account-signup-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata = {
  title: "Create account | Is it normal?",
  description:
    "Create an optional username-only account to sync saved cards across devices.",
};

export default function AccountSignupPage() {
  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <AccountSignupForm />
      </main>
      <SiteFooter />
    </div>
  );
}
