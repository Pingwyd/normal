import Link from "next/link";
import { Share2 } from "lucide-react";

import { SaveButton } from "@/components/favorites/save-button";
import type { CardSummary } from "@/lib/api/types";

type CardSummaryTileProps = {
  card: CardSummary;
};

export function CardSummaryTile({ card }: CardSummaryTileProps) {
  const reviewedLabel =
    card.last_reviewed_at !== null ? "reviewed" : "not yet reviewed";

  return (
    <article className="group flex h-full cursor-pointer flex-col gap-3.5 rounded-2xl border border-border bg-surface p-[22px] transition duration-[180ms] hover:-translate-y-[3px] hover:border-transparent hover:shadow-[0_10px_24px_rgba(32,43,38,0.08)]">
      <Link href={`/cards/${card.slug}`} className="flex flex-1 flex-col gap-3.5">
        <p className="font-mono text-[10.5px] uppercase tracking-wide text-sage">
          {card.category.name}
        </p>
        <h3 className="font-display text-lg font-medium leading-[1.35] text-foreground">
          {card.question}
        </h3>
        <p className="text-[13.5px] leading-[1.55] text-ink-secondary">
          {card.brief}
        </p>
      </Link>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-2">
        <p className="font-mono text-[10.5px] text-ink-secondary">
          {card.source_count} source{card.source_count === 1 ? "" : "s"} ·{" "}
          {reviewedLabel}
        </p>
        <div className="flex items-center gap-2.5 text-[13px] text-ink-secondary">
          <SaveButton
            contentType="card"
            contentId={card.id}
            label={card.question}
            cardSlug={card.slug}
            cardQuestion={card.question}
          />
          <span className="text-[11px]">{card.save_count}</span>
          <Link
            href={`/cards/${card.slug}`}
            className="inline-flex items-center text-ink-secondary hover:text-sage-dark"
            aria-label={`Open ${card.question}`}
          >
            <Share2 size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
