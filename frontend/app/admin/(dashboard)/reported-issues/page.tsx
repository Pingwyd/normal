import Link from "next/link";

import { fetchAdminReportedIssues } from "@/lib/admin/queries";
import { formatAdminDateTime } from "@/lib/admin/format";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

export default async function AdminReportedIssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const { data: issues } = await fetchAdminReportedIssues({
    status: status || undefined,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">
          Reported issues
        </h1>
        <p className="text-sm text-muted">
          Review public reports about outdated or incorrect card content.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Reported issue status filters"
      >
        {STATUS_OPTIONS.map((option) => {
          const href = option.value
            ? `/admin/reported-issues?status=${option.value}`
            : "/admin/reported-issues";
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

      {issues.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-sm text-muted">
          No reported issues match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface">
          {issues.map((issue) => (
            <li key={issue.id}>
              <Link
                href={`/admin/reported-issues/${issue.id}`}
                className="block px-5 py-4 hover:bg-surface-muted"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-ink-secondary">
                      {issue.description}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      Reported {formatAdminDateTime(issue.created_at)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p className="font-mono uppercase tracking-wide text-sage">
                      {issue.status.replaceAll("_", " ")}
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
