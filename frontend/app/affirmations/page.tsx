import type { Metadata } from "next";

import { AffirmationDeckView } from "@/components/deck/affirmation-deck-view";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PushOptInPrompt } from "@/components/notifications/push-opt-in-prompt";
import { ApiRequestError } from "@/lib/api/errors";
import { fetchAffirmationsPageServer } from "@/lib/affirmations/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Affirmations | Is it normal?",
  description:
    "Swipe through grounded affirmations and save the ones that resonate.",
};

type AffirmationsPageProps = {
  searchParams: Promise<{ mood?: string; tag?: string }>;
};

export default async function AffirmationsPage({
  searchParams,
}: AffirmationsPageProps) {
  const params = await searchParams;
  const mood = params.mood?.trim() || undefined;
  const tag = params.tag?.trim() || undefined;

  let initialItems: Awaited<
    ReturnType<typeof fetchAffirmationsPageServer>
  >["items"] = [];
  let initialMeta: Awaited<
    ReturnType<typeof fetchAffirmationsPageServer>
  >["meta"] = null;
  let errorMessage: string | null = null;

  try {
    const page = await fetchAffirmationsPageServer({ mood, tag });
    initialItems = page.items;
    initialMeta = page.meta;
  } catch (error) {
    errorMessage =
      error instanceof ApiRequestError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not load affirmations.";
  }

  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mx-auto mb-8 max-w-md space-y-3 text-center">
          <h1 className="font-display text-3xl text-foreground sm:text-4xl">
            Affirmations
          </h1>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            Swipe right to save, left to skip. No forced positivity, just
            phrases that feel honest.
          </p>
        </section>

        <div className="mx-auto mb-6 max-w-2xl">
          <PushOptInPrompt />
        </div>

        {errorMessage ? (
          <div className="mx-auto max-w-md rounded-xl border border-warning-border bg-warning-surface px-6 py-8 text-center">
            <p className="font-display text-lg text-foreground">
              We could not load affirmations
            </p>
            <p className="mt-2 text-sm text-muted">{errorMessage}</p>
          </div>
        ) : (
          <AffirmationDeckView
            initialItems={initialItems}
            initialMeta={initialMeta}
            moodFilter={mood}
            tagFilter={tag}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
