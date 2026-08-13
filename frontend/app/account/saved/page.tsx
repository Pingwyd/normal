import { SavedCardsList } from "@/components/account/saved-cards-list";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata = {
  title: "Saved items | Is it normal?",
  description:
    "View cards, affirmations, and quotes you have saved on your account or device.",
};

export default function AccountSavedPage() {
  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mx-auto mb-8 max-w-2xl space-y-3 text-center">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            Saved items
          </h1>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            Cards, affirmations, and quotes you save on this device or sync to
            your account appear here.
          </p>
        </section>
        <SavedCardsList />
      </main>
      <SiteFooter />
    </div>
  );
}
