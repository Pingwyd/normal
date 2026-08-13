import { ExternalLink } from "lucide-react";

import { getSourceTierLabel } from "@/lib/source-tiers";
import type { Source } from "@/lib/api/types";

type SourcesListProps = {
  sources: Source[];
};

export function SourcesList({ sources }: SourcesListProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="sources-heading" className="space-y-4">
      <h2
        id="sources-heading"
        className="font-display text-2xl font-medium text-foreground"
      >
        Sources
      </h2>
      <ul className="space-y-4">
        {sources.map((source) => (
          <li
            key={source.id}
            className="rounded-2xl border border-border bg-surface p-[22px]"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-display text-lg font-medium text-foreground">
                  {source.title}
                </p>
                <p className="mt-1 text-[13.5px] text-ink-secondary">
                  {source.author_or_org}
                </p>
              </div>
              <span className="font-mono text-[10.5px] uppercase tracking-wide text-sage">
                {getSourceTierLabel(source.tier)}
              </span>
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-sage-dark hover:text-sage"
            >
              View source
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
