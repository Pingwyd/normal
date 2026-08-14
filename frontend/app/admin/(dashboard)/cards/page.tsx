import Link from "next/link";

import { fetchAdminCards } from "@/lib/admin/queries";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

export default async function AdminCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const cards = await fetchAdminCards(status || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">Cards</h1>
          <p className="text-sm text-muted">
            Create, edit, and publish card content.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/cards/import"
            className="rounded-full border border-sage-dark bg-surface px-4 py-2 text-sm font-medium text-sage-dark hover:bg-sage-dark hover:text-white"
          >
            Import draft
          </Link>
          <Link
            href="/admin/research"
            className="rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-sage-dark hover:border-sage"
          >
            AI research
          </Link>
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Status filters"
      >
        {STATUS_OPTIONS.map((option) => {
          const href = option.value
            ? `/admin/cards?status=${option.value}`
            : "/admin/cards";
          const isActive = status === option.value;
          return (
            <Link
              key={option.label}
              href={href}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                isActive
                  ? "bg-sage-dark text-white"
                  : "border border-border-strong bg-surface text-sage-dark"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-sm text-muted">
          No cards match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={`/admin/cards/${card.id}`}
                className="block px-5 py-4 hover:bg-surface-muted"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {card.question}
                    </p>
                    <p className="mt-1 text-sm text-muted">{card.brief}</p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p className="font-mono uppercase tracking-wide text-sage">
                      {card.status}
                    </p>
                    {card.requires_clinical_review ? (
                      <p className="mt-1">Clinical review</p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
