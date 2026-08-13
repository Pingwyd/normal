import Link from "next/link";

import type { RelatedCard } from "@/lib/api/types";

type RelatedCardsProps = {
  relatedCards: RelatedCard[];
};

export function RelatedCards({ relatedCards }: RelatedCardsProps) {
  if (relatedCards.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-heading" className="space-y-4">
      <h2
        id="related-heading"
        className="font-display text-2xl text-foreground"
      >
        Related cards
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {relatedCards.map((card) => (
          <li key={card.id}>
            <Link
              href={`/cards/${card.slug}`}
              className="block rounded-xl border border-border bg-surface p-4 transition-shadow hover:shadow-md"
            >
              <p className="font-display text-lg leading-snug text-foreground">
                {card.question}
              </p>
              <p className="mt-2 text-sm text-muted">{card.brief}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
