import { notFound } from "next/navigation";

import { ReflectionDetailView } from "@/components/reflections/reflection-detail-view";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ApiRequestError } from "@/lib/api/errors";
import type { ReflectionDetail } from "@/lib/api/reflection-types";
import { fetchReflectionBySlugServer } from "@/lib/reflections/server-api";

export const dynamic = "force-dynamic";

type ReflectionDetailPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadReflection(slug: string): Promise<ReflectionDetail> {
  try {
    return await fetchReflectionBySlugServer(slug);
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

export default async function ReflectionDetailPage({
  params,
}: ReflectionDetailPageProps) {
  const { slug } = await params;
  const reflection = await loadReflection(slug);

  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <ReflectionDetailView reflection={reflection} />
      </main>
      <SiteFooter />
    </div>
  );
}
