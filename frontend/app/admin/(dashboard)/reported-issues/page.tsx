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
        <h1 className="font-display text-3xl text-[#202B26]">
          Reported issues
        </h1>
        <p className="text-sm text-[#5A6560]">
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
                  ? "bg-[#33473D] text-white"
                  : "border border-[#CFCBC2] bg-white text-[#33473D]"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {issues.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#CFCBC2] bg-white px-6 py-10 text-center text-sm text-[#5A6560]">
          No reported issues match this filter.
        </p>
      ) : (
        <ul className="divide-y divide-[#ECEAE4] overflow-hidden rounded-xl border border-[#D8D5CC] bg-white">
          {issues.map((issue) => (
            <li key={issue.id}>
              <Link
                href={`/admin/reported-issues/${issue.id}`}
                className="block px-5 py-4 hover:bg-[#F7F6F2]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm text-[#3A4540]">
                      {issue.description}
                    </p>
                    <p className="mt-2 text-xs text-[#5A6560]">
                      Reported {formatAdminDateTime(issue.created_at)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[#5A6560]">
                    <p className="font-mono uppercase tracking-wide text-[#4B6B5E]">
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
