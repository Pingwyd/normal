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
          <h1 className="font-display text-3xl text-foreground">Affirmations</h1>
          <p className="text-sm text-muted">
            Create and publish affirmations for the swipe deck.
          </p>
        </div>
        <Link
          href="/admin/affirmations/new"
          className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white"
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
                  ? "bg-sage-dark text-white"
                  : "border border-border-strong bg-surface text-sage-dark"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {affirmations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-sm text-muted">
          No affirmations match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface">
          {affirmations.map((affirmation) => (
            <li key={affirmation.id}>
              <Link
                href={`/admin/affirmations/${affirmation.id}`}
                className="block px-5 py-4 hover:bg-surface-muted"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-medium text-foreground">
                    {affirmation.text}
                  </p>
                  <p className="font-mono text-xs uppercase tracking-wide text-sage">
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
