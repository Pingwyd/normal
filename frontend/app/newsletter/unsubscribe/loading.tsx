import { PageLoadingShell } from "@/components/layout/page-loading-shell";
import { NewsletterUnsubscribeSkeleton } from "@/components/notifications/newsletter-unsubscribe-skeleton";

export default function NewsletterUnsubscribeLoading() {
  return (
    <PageLoadingShell mainClassName="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
      <NewsletterUnsubscribeSkeleton />
    </PageLoadingShell>
  );
}
