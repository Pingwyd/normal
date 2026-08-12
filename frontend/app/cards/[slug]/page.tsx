import { notFound } from "next/navigation";

import { CardDetailView } from "@/components/cards/card-detail-view";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchCardBySlug } from "@/lib/api/cards";
import { ApiRequestError } from "@/lib/api/errors";
import type { CardDetail } from "@/lib/api/types";

export const dynamic = "force-dynamic";

type CardDetailPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadCard(slug: string): Promise<CardDetail> {
  try {
    return await fetchCardBySlug(slug);
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const { slug } = await params;
  const card = await loadCard(slug);

  return (
    <div className="min-h-full bg-[#F2F1EC]">
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <CardDetailView card={card} />
      </main>
      <SiteFooter />
    </div>
  );
}
