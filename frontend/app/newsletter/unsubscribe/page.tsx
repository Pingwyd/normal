import { NewsletterUnsubscribePanel } from "@/components/notifications/newsletter-unsubscribe-panel";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function NewsletterUnsubscribePage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <NewsletterUnsubscribePanel />
      </main>
      <SiteFooter />
    </>
  );
}
