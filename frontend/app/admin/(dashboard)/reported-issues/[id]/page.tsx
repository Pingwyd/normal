import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportedIssueReviewForm } from "@/components/admin/reported-issue-review-form";
import { fetchAdminCard, fetchAdminReportedIssue } from "@/lib/admin/queries";
import { formatAdminDateTime } from "@/lib/admin/format";
import { ApiRequestError } from "@/lib/api/errors";

async function loadReportedIssueReviewData(id: string) {
  try {
    const issue = await fetchAdminReportedIssue(id);
    let cardQuestion: string | null = null;
    try {
      const card = await fetchAdminCard(issue.card_id);
      cardQuestion = card.question;
    } catch {
      cardQuestion = null;
    }
    return { issue, cardQuestion };
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

export default async function AdminReportedIssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { issue, cardQuestion } = await loadReportedIssueReviewData(id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/reported-issues"
          className="text-sm text-[#33473D] hover:text-[#4B6B5E]"
        >
          Back to reported issues
        </Link>
        <h1 className="mt-3 font-display text-3xl text-[#202B26]">
          Review reported issue
        </h1>
        <p className="mt-2 text-sm text-[#5A6560]">
          Reported {formatAdminDateTime(issue.created_at)}
        </p>
      </div>

      <section className="rounded-xl border border-[#D8D5CC] bg-white p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[#5A6560]">Current status</dt>
            <dd className="font-mono uppercase tracking-wide text-[#4B6B5E]">
              {issue.status.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-[#5A6560]">Last updated</dt>
            <dd className="text-[#202B26]">
              {formatAdminDateTime(issue.updated_at)}
            </dd>
          </div>
        </dl>
      </section>

      <ReportedIssueReviewForm issue={issue} cardQuestion={cardQuestion} />
    </div>
  );
}
