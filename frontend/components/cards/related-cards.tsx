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
        className="font-display text-2xl font-medium text-foreground"
      >
        Related cards
      </h2>
      <ul className="grid gap-[18px] sm:grid-cols-2">
        {relatedCards.map((card) => (
          <li key={card.id}>
            <Link
              href={`/cards/${card.slug}`}
              className="block rounded-2xl border border-border bg-surface p-[22px] transition duration-[180ms] hover:-translate-y-[3px] hover:border-transparent hover:shadow-[0_10px_24px_rgba(32,43,38,0.08)]"
            >
              <p className="font-display text-lg font-medium leading-snug text-foreground">
                {card.question}
              </p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-secondary">
                {card.brief}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
