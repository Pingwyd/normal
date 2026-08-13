import Link from "next/link";
import { Share2 } from "lucide-react";

import { SaveButton } from "@/components/favorites/save-button";
import type { CardSummary } from "@/lib/api/types";

type CardSummaryTileProps = {
  card: CardSummary;
};

export function CardSummaryTile({ card }: CardSummaryTileProps) {
  const reviewedLabel =
    card.last_reviewed_at !== null ? "Reviewed" : "Not yet reviewed";

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/cards/${card.slug}`} className="flex flex-1 flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-wide text-sage">
          {card.category.name}
        </p>
        <h2 className="font-display text-xl leading-snug text-foreground">
          {card.question}
        </h2>
        <p className="text-sm leading-relaxed text-ink-secondary">{card.brief}</p>
      </Link>
      <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-4 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            {card.source_count} source{card.source_count === 1 ? "" : "s"}
          </span>
          <span className="font-mono uppercase tracking-wide text-sage">
            {reviewedLabel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <SaveButton
            contentType="card"
            contentId={card.id}
            label={card.question}
            cardSlug={card.slug}
            cardQuestion={card.question}
          />
          <span className="text-muted">{card.save_count} total saves</span>
          <Link
            href={`/cards/${card.slug}`}
            className="inline-flex items-center gap-1 text-sage-dark hover:text-sage"
            aria-label={`Share ${card.question}`}
          >
            <Share2 size={14} aria-hidden="true" />
            <span className="sr-only">Open card</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
