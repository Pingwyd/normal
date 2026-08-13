import type { Metadata } from "next";

import { DeckPanelSection } from "@/components/deck/deck-panel-section";
import { QuoteDeckView } from "@/components/deck/quote-deck-view";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PushOptInPrompt } from "@/components/notifications/push-opt-in-prompt";
import { ApiRequestError } from "@/lib/api/errors";
import { fetchQuotesPageServer } from "@/lib/quotes/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quotes | Is it normal?",
  description: "Swipe through attributed quotes and save the ones you want.",
};

export default async function QuotesPage() {
  let initialItems: Awaited<ReturnType<typeof fetchQuotesPageServer>>["items"] =
    [];
  let initialMeta: Awaited<ReturnType<typeof fetchQuotesPageServer>>["meta"] =
    null;
  let errorMessage: string | null = null;

  try {
    const page = await fetchQuotesPageServer();
    initialItems = page.items;
    initialMeta = page.meta;
  } catch (error) {
    errorMessage =
      error instanceof ApiRequestError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not load quotes.";
  }

  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-7 sm:py-10">
        <div className="mx-auto mb-6 max-w-2xl">
          <PushOptInPrompt />
        </div>

        {errorMessage ? (
          <div className="mx-auto max-w-md rounded-xl border border-warning-border bg-warning-surface px-6 py-8 text-center">
            <p className="font-display text-lg text-foreground">
              We could not load quotes
            </p>
            <p className="mt-2 text-sm text-muted">{errorMessage}</p>
          </div>
        ) : (
          <DeckPanelSection
            eyebrow="Daily · attributed quotes"
            title="Words worth keeping."
            description="Swipe through short, attributed quotes you can save or share. Each one names its source so you know where it came from."
          >
            <QuoteDeckView
              initialItems={initialItems}
              initialMeta={initialMeta}
            />
          </DeckPanelSection>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
