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
    <div className="min-h-full bg-[#F2F1EC]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <article className="mx-auto max-w-md rounded-3xl border border-[#D8D5CC] bg-white p-8 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4B6B5E]">
            Quote
          </p>
          <p className="mt-4 font-display text-2xl leading-relaxed text-[#202B26]">
            &ldquo;{quote.text}&rdquo;
          </p>
          <p className="mt-4 text-sm font-medium text-[#5A6560]">
            {quote.attributed_to}
          </p>
          {quote.source_url ? (
            <a
              href={quote.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-[#33473D] hover:underline"
            >
              Source
            </a>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/quotes"
              className="rounded-full bg-[#33473D] px-4 py-2 text-sm font-medium text-white hover:bg-[#4B6B5E]"
            >
              Browse quotes
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#33473D] bg-white px-4 py-2 text-sm font-medium text-[#33473D]"
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
