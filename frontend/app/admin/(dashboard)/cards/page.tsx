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
          <h1 className="font-display text-3xl text-[#202B26]">Cards</h1>
          <p className="text-sm text-[#5A6560]">
            Create, edit, and publish card content.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Status filters">
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
                  ? "bg-[#33473D] text-white"
                  : "border border-[#CFCBC2] bg-white text-[#33473D]"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#CFCBC2] bg-white px-6 py-10 text-center text-sm text-[#5A6560]">
          No cards match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-[#ECEAE4] overflow-hidden rounded-xl border border-[#D8D5CC] bg-white">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={`/admin/cards/${card.id}`}
                className="block px-5 py-4 hover:bg-[#F7F6F2]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#202B26]">{card.question}</p>
                    <p className="mt-1 text-sm text-[#5A6560]">{card.brief}</p>
                  </div>
                  <div className="text-right text-xs text-[#5A6560]">
                    <p className="font-mono uppercase tracking-wide text-[#4B6B5E]">
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
