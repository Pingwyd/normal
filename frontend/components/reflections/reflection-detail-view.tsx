import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CrisisResourceStrip } from "@/components/layout/crisis-resource-strip";
import type { ReflectionDetail } from "@/lib/api/reflection-types";

import { ReflectionBlockRenderer } from "./reflection-block-renderer";

type ReflectionDetailViewProps = {
  reflection: ReflectionDetail;
};

export function ReflectionDetailView({
  reflection,
}: ReflectionDetailViewProps) {
  const isLong = reflection.format === "long";

  return (
    <article className="mx-auto w-full max-w-3xl space-y-10">
      <div>
        <Link
          href="/reflections"
          className="inline-flex items-center gap-2 text-sm text-sage-dark hover:text-sage"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to reflections
        </Link>
      </div>

      {reflection.is_crisis_adjacent ? <CrisisResourceStrip /> : null}

      <header className="space-y-4 border-b border-border pb-8">
        <p className="font-mono text-[10.5px] uppercase tracking-wide text-accent">
          Personal reflection
        </p>
        <h1 className="font-display text-3xl font-medium leading-tight text-foreground sm:text-4xl">
          {reflection.title}
        </h1>
        <p className="text-lg leading-relaxed text-ink-secondary">
          {reflection.brief}
        </p>
        {reflection.tags.length > 0 ? (
          <p className="font-mono text-[10.5px] uppercase tracking-wide text-ink-secondary">
            {reflection.tags.map((tag) => tag.name).join(", ")}
          </p>
        ) : null}
        <p className="text-sm text-muted">
          This is the founder&apos;s personal perspective. It is not reviewed or
          sourced like the main card library.
        </p>
      </header>

      {isLong ? (
        <ReflectionBlockRenderer blocks={reflection.reflection_blocks} />
      ) : (
        <section className="rounded-xl border border-dashed border-accent/70 bg-surface px-5 py-4">
          <p className="text-[15px] leading-relaxed text-foreground">
            {reflection.brief}
          </p>
        </section>
      )}
    </article>
  );
}
