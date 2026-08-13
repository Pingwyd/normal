import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchQuoteByIdServer } from "@/lib/quotes/server-api";

export const dynamic = "force-dynamic";

type ShareQuotePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ShareQuotePageProps): Promise<Metadata> {
  const { id } = await params;
  const quote = await fetchQuoteByIdServer(id);
  if (!quote) {
    return {
      title: "Quote not found | Is it normal?",
    };
  }

  const description =
    quote.text.length > 160 ? `${quote.text.slice(0, 157)}...` : quote.text;

  return {
    title: `Quote by ${quote.attributed_to} | Is it normal?`,
    description,
    openGraph: {
      title: `Quote by ${quote.attributed_to} | Is it normal?`,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `Quote by ${quote.attributed_to} | Is it normal?`,
      description,
    },
  };
}

export default async function ShareQuotePage({ params }: ShareQuotePageProps) {
  const { id } = await params;
  const quote = await fetchQuoteByIdServer(id);
  if (!quote) {
    notFound();
  }

  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <article className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-8 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-sage">
            Quote
          </p>
          <p className="mt-4 font-display text-2xl leading-relaxed text-foreground">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-4 text-sm font-medium text-muted">
            {quote.attributed_to}
          </p>
          {quote.source_url ? (
            <a
              href={quote.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-sage-dark hover:underline"
            >
              Source
            </a>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/quotes"
              className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white hover:bg-sage"
            >
              Browse quotes
            </Link>
            <Link
              href="/"
              className="rounded-full border border-sage-dark bg-surface px-4 py-2 text-sm font-medium text-sage-dark"
            >
              Home
            </Link>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
