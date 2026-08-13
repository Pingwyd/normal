import Link from "next/link";

import { fetchDueForReviewCards } from "@/lib/admin/queries";

export default async function AdminDueForReviewPage() {
  const cards = await fetchDueForReviewCards();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">
          Due for review
        </h1>
        <p className="text-sm text-muted">
          Published cards with a review date that has passed or is approaching.
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-sm text-muted">
          No cards are due for review right now.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={`/admin/cards/${card.id}`}
                className="block px-5 py-4 hover:bg-surface-muted"
              >
                <p className="font-medium text-foreground">{card.question}</p>
                <p className="mt-1 text-xs text-muted">
                  Review due:{" "}
                  {card.next_review_due
                    ? new Date(card.next_review_due).toLocaleDateString()
                    : "N/A"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
