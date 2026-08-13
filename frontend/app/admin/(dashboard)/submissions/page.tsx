import Link from "next/link";

import { fetchAdminSubmissions } from "@/lib/admin/queries";
import { formatAdminDateTime } from "@/lib/admin/format";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In review" },
  { value: "drafted", label: "Drafted" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const { data: submissions } = await fetchAdminSubmissions({
    status: status || undefined,
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Submissions</h1>
        <p className="text-sm text-muted">
          Review suggested questions from the public queue.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Submission status filters"
      >
        {STATUS_OPTIONS.map((option) => {
          const href = option.value
            ? `/admin/submissions?status=${option.value}`
            : "/admin/submissions";
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

      {submissions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-sm text-muted">
          No submissions match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface">
          {submissions.map((submission) => (
            <li key={submission.id}>
              <Link
                href={`/admin/submissions/${submission.id}`}
                className="block px-5 py-4 hover:bg-surface-muted"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {submission.question_text}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Submitted {formatAdminDateTime(submission.created_at)}
                    </p>
                    {submission.likely_duplicate_of ? (
                      <p className="mt-1 text-xs text-secondary">
                        Possible duplicate flagged
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right text-xs text-muted">
                    <p className="font-mono uppercase tracking-wide text-sage">
                      {submission.status.replaceAll("_", " ")}
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
