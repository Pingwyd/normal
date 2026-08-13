import type { Metadata } from "next";

import { QuoteDeckView } from "@/components/deck/quote-deck-view";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
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
    <div className="min-h-full bg-[#F2F1EC]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mx-auto mb-8 max-w-md space-y-3 text-center">
          <h1 className="font-display text-3xl text-[#202B26] sm:text-4xl">
            Quotes
          </h1>
          <p className="text-sm leading-relaxed text-[#5A6560] sm:text-base">
            Short, attributed quotes you can save or share without the noise.
          </p>
        </section>

        {errorMessage ? (
          <div className="mx-auto max-w-md rounded-xl border border-[#E8A97A] bg-white px-6 py-8 text-center">
            <p className="font-display text-lg text-[#202B26]">
              We could not load quotes
            </p>
            <p className="mt-2 text-sm text-[#5A6560]">{errorMessage}</p>
          </div>
        ) : (
          <QuoteDeckView
            initialItems={initialItems}
            initialMeta={initialMeta}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
