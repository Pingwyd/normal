import type { CardSummary } from "@/lib/api/types";

import { CardSummaryTile } from "./card-summary-tile";

type CardGridProps = {
  cards: CardSummary[];
};

export function CardGrid({ cards }: CardGridProps) {
  const safeCards = cards ?? [];

  if (safeCards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
        <p className="font-display text-lg text-foreground">No cards found</p>
        <p className="mt-2 text-sm text-muted">
          Try a different search term or category filter.
        </p>
      </div>
    );
  }

  return (
    <div className="card-feed-grid grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {safeCards.map((card) => (
        <CardSummaryTile key={card.id} card={card} />
      ))}
    </div>
  );
}
