import Link from "next/link";

import type { ReflectionSummary } from "@/lib/api/reflection-types";

type ReflectionSummaryTileProps = {
  reflection: ReflectionSummary;
};

export function ReflectionSummaryTile({
  reflection,
}: ReflectionSummaryTileProps) {
  const isShort = reflection.format === "short";
  const href = `/reflections/${reflection.slug}`;

  return (
    <article className="group flex h-full flex-col gap-3.5 rounded-2xl border border-dashed border-accent/70 bg-surface p-[22px] transition duration-[180ms] hover:-translate-y-[3px] hover:border-accent hover:shadow-[0_10px_24px_rgba(32,43,38,0.08)]">
      <Link href={href} className="flex flex-1 flex-col gap-3.5">
        <p className="font-mono text-[10.5px] uppercase tracking-wide text-accent">
          Personal reflection
        </p>
        <h3 className="font-display text-lg font-medium leading-[1.35] text-foreground">
          {reflection.title}
        </h3>
        <p className="text-[13.5px] leading-[1.55] text-ink-secondary">
          {reflection.brief}
        </p>
      </Link>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
        {reflection.tags.length > 0 ? (
          <p className="font-mono text-[10.5px] text-ink-secondary">
            {reflection.tags.map((tag) => tag.name).join(", ")}
          </p>
        ) : (
          <span />
        )}
        {!isShort ? (
          <Link
            href={href}
            className="text-[13px] font-semibold text-sage-dark hover:text-sage"
          >
            Read more
          </Link>
        ) : null}
      </div>
    </article>
  );
}
