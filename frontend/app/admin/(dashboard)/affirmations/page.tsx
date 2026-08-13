import Link from "next/link";

import { fetchAdminAffirmations } from "@/lib/admin/queries";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

export default async function AdminAffirmationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const affirmations = await fetchAdminAffirmations(status || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-[#202B26]">Affirmations</h1>
          <p className="text-sm text-[#5A6560]">
            Create and publish affirmations for the swipe deck.
          </p>
        </div>
        <Link
          href="/admin/affirmations/new"
          className="rounded-full bg-[#33473D] px-4 py-2 text-sm font-medium text-white"
        >
          New affirmation
        </Link>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Status filters"
      >
        {STATUS_OPTIONS.map((option) => {
          const href = option.value
            ? `/admin/affirmations?status=${option.value}`
            : "/admin/affirmations";
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

      {affirmations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#CFCBC2] bg-white px-6 py-10 text-center text-sm text-[#5A6560]">
          No affirmations match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-[#ECEAE4] overflow-hidden rounded-xl border border-[#D8D5CC] bg-white">
          {affirmations.map((affirmation) => (
            <li key={affirmation.id}>
              <Link
                href={`/admin/affirmations/${affirmation.id}`}
                className="block px-5 py-4 hover:bg-[#F7F6F2]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-medium text-[#202B26]">
                    {affirmation.text}
                  </p>
                  <p className="font-mono text-xs uppercase tracking-wide text-[#4B6B5E]">
                    {affirmation.status}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
