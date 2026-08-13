import type { Metadata } from "next";
import Link from "next/link";

import { AffirmationDeckView } from "@/components/deck/affirmation-deck-view";
import { DeckPanelSection } from "@/components/deck/deck-panel-section";
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
      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-7 sm:py-10">
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
          <DeckPanelSection
            eyebrow="Daily · personalize by mood"
            title="A small reminder, every day."
            description="Swipe through short, reviewed affirmations filtered by what you are actually dealing with, not generic quotes. Save the ones that land. Share the ones your friends need too."
            action={
              <Link
                href="/account/settings"
                className="inline-flex rounded-full bg-accent px-5 py-2.5 text-[13.5px] font-bold text-sage-dark"
              >
                Get these by email
              </Link>
            }
          >
            <AffirmationDeckView
              initialItems={initialItems}
              initialMeta={initialMeta}
              moodFilter={mood}
              tagFilter={tag}
            />
          </DeckPanelSection>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
