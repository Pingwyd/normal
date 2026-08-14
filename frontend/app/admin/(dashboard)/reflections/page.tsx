import Link from "next/link";

import { requireFounderSession } from "@/lib/admin/api";
import { fetchAdminReflections } from "@/lib/admin/queries";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

export default async function AdminReflectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireFounderSession();
  const params = await searchParams;
  const status = params.status ?? "";
  const reflections = await fetchAdminReflections(status || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">
            Reflections
          </h1>
          <p className="text-sm text-muted">
            Founder personal reflections for the public Reflections section.
          </p>
        </div>
        <Link
          href="/admin/reflections/new"
          className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white"
        >
          New reflection
        </Link>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Status filters"
      >
        {STATUS_OPTIONS.map((option) => {
          const href = option.value
            ? `/admin/reflections?status=${option.value}`
            : "/admin/reflections";
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

      {reflections.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-sm text-muted">
          No reflections match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface">
          {reflections.map((reflection) => (
            <li key={reflection.id}>
              <Link
                href={`/admin/reflections/${reflection.id}`}
                className="block px-5 py-4 hover:bg-surface-muted"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-foreground">
                      {reflection.title}
                    </p>
                    <p className="text-sm text-muted">{reflection.brief}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs uppercase tracking-wide text-sage">
                      {reflection.status}
                    </p>
                    <p className="font-mono text-[10.5px] uppercase tracking-wide text-ink-secondary">
                      {reflection.format}
                    </p>
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
