import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchAffirmationByIdServer } from "@/lib/affirmations/server-api";

export const dynamic = "force-dynamic";

type ShareAffirmationPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ShareAffirmationPageProps): Promise<Metadata> {
  const { id } = await params;
  const affirmation = await fetchAffirmationByIdServer(id);
  if (!affirmation) {
    return {
      title: "Affirmation not found | Is it normal?",
    };
  }

  const description =
    affirmation.text.length > 160
      ? `${affirmation.text.slice(0, 157)}...`
      : affirmation.text;

  return {
    title: "Affirmation | Is it normal?",
    description,
    openGraph: {
      title: "Affirmation | Is it normal?",
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: "Affirmation | Is it normal?",
      description,
    },
  };
}

export default async function ShareAffirmationPage({
  params,
}: ShareAffirmationPageProps) {
  const { id } = await params;
  const affirmation = await fetchAffirmationByIdServer(id);
  if (!affirmation) {
    notFound();
  }

  return (
    <div className="min-h-full bg-[#F2F1EC]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <article className="mx-auto max-w-md rounded-3xl border border-[#D8D5CC] bg-white p-8 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4B6B5E]">
            Affirmation
          </p>
          <p className="mt-4 font-display text-2xl leading-relaxed text-[#202B26]">
            {affirmation.text}
          </p>
          {affirmation.tags.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {affirmation.tags.map((tag) => (
                <li
                  key={tag.id}
                  className="rounded-full bg-[#EAF2EC] px-3 py-1 text-xs font-medium text-[#33473D]"
                >
                  {tag.name}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/affirmations"
              className="rounded-full bg-[#33473D] px-4 py-2 text-sm font-medium text-white hover:bg-[#4B6B5E]"
            >
              Browse affirmations
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
