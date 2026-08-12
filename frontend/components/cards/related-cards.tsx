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
      <h2 id="related-heading" className="font-display text-2xl text-[#202B26]">
        Related cards
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {relatedCards.map((card) => (
          <li key={card.id}>
            <Link
              href={`/cards/${card.slug}`}
              className="block rounded-xl border border-[#D8D5CC] bg-white p-4 transition-shadow hover:shadow-md"
            >
              <p className="font-display text-lg leading-snug text-[#202B26]">
                {card.question}
              </p>
              <p className="mt-2 text-sm text-[#5A6560]">{card.brief}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
