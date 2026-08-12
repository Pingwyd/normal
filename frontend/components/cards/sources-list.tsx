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
      <h2 id="sources-heading" className="font-display text-2xl text-[#202B26]">
        Sources
      </h2>
      <ul className="space-y-4">
        {sources.map((source) => (
          <li
            key={source.id}
            className="rounded-xl border border-[#D8D5CC] bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-[#202B26]">{source.title}</p>
                <p className="mt-1 text-sm text-[#5A6560]">
                  {source.author_or_org}
                </p>
              </div>
              <span className="font-mono text-xs uppercase tracking-wide text-[#4B6B5E]">
                {getSourceTierLabel(source.tier)}
              </span>
            </div>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm text-[#33473D] hover:text-[#4B6B5E]"
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
