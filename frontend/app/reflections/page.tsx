import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ReflectionGrid } from "@/components/reflections/reflection-grid";
import { ReflectionTagChips } from "@/components/reflections/reflection-tag-chips";
import { ReflectionsLoadMore } from "@/components/reflections/reflections-load-more";
import { ApiRequestError } from "@/lib/api/errors";
import type { ReflectionTag } from "@/lib/api/reflection-types";
import {
  fetchAccumulatedReflections,
  fetchReflectionsPageServer,
} from "@/lib/reflections/server-api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reflections | Is it normal?",
  description:
    "Personal reflections from the founder: lived experience, not reviewed or sourced like the main card library.",
};

type ReflectionsPageProps = {
  searchParams: Promise<{ tag?: string; after?: string }>;
};

function collectTags(
  items: Awaited<ReturnType<typeof fetchReflectionsPageServer>>["items"],
): ReflectionTag[] {
  const byId = new Map<string, ReflectionTag>();
  for (const item of items) {
    for (const tag of item.tags) {
      byId.set(tag.id, tag);
    }
  }
  return [...byId.values()];
}

export default async function ReflectionsPage({
  searchParams,
}: ReflectionsPageProps) {
  const params = await searchParams;
  const tag = params.tag?.trim() || undefined;
  const after = params.after?.trim() || undefined;

  let items: Awaited<ReturnType<typeof fetchAccumulatedReflections>>["items"] =
    [];
  let meta: Awaited<ReturnType<typeof fetchAccumulatedReflections>>["meta"] =
    null;
  let filterTags: ReflectionTag[] = [];
  let errorMessage: string | null = null;

  try {
    const [page, tagDiscovery] = await Promise.all([
      fetchAccumulatedReflections({ tag, after, limit: 20 }),
      tag ? Promise.resolve(null) : fetchReflectionsPageServer({ limit: 50 }),
    ]);
    items = page.items;
    meta = page.meta;
    filterTags = tagDiscovery
      ? collectTags(tagDiscovery.items)
      : collectTags(items);
  } catch (error) {
    errorMessage =
      error instanceof ApiRequestError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Could not load reflections.";
  }

  return (
    <div className="min-h-full bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-7 sm:py-10">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <p className="font-mono text-[10.5px] uppercase tracking-wide text-sage">
            Founder voice
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium text-foreground sm:text-4xl">
            Reflections
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
            Personal perspective and lived experience. These pieces are not
            reviewed or sourced like the main card library.
          </p>
        </header>

        {errorMessage ? (
          <div className="mx-auto max-w-md rounded-xl border border-warning-border bg-warning-surface px-6 py-8 text-center">
            <p className="font-display text-lg text-foreground">
              We could not load reflections
            </p>
            <p className="mt-2 text-sm text-muted">{errorMessage}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <ReflectionTagChips tags={filterTags} activeTag={tag} />
            <ReflectionGrid reflections={items} />
            <ReflectionsLoadMore meta={meta} tag={tag} />
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
