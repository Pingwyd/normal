import type { ReactNode } from "react";

import type { CardSummary } from "@/lib/api/types";

import { BrowseAdSlot } from "@/components/browse/browse-ad-slot";

import { CardSummaryTile } from "./card-summary-tile";

const AD_SLOT_AFTER_INDEX = 2;

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

  const gridItems: ReactNode[] = [];
  safeCards.forEach((card, index) => {
    gridItems.push(<CardSummaryTile key={card.id} card={card} />);
    if (index === AD_SLOT_AFTER_INDEX) {
      gridItems.push(<BrowseAdSlot key="browse-ad-slot" />);
    }
  });

  return (
    <div className="card-feed-grid mb-16 grid grid-cols-1 gap-[18px] lg:grid-cols-3">
      {gridItems}
    </div>
  );
}
