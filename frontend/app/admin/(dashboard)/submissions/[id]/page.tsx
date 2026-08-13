import Link from "next/link";
import { notFound } from "next/navigation";

import { SubmissionReviewForm } from "@/components/admin/submission-review-form";
import { fetchAdminCards, fetchAdminSubmission } from "@/lib/admin/queries";
import { formatAdminDateTime } from "@/lib/admin/format";
import { ApiRequestError } from "@/lib/api/errors";

async function loadSubmissionReviewData(id: string) {
  try {
    const [submission, cards] = await Promise.all([
      fetchAdminSubmission(id),
      fetchAdminCards("published"),
    ]);
    return { submission, cards };
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "NOT_FOUND") {
      notFound();
    }
    throw error;
  }
}

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { submission, cards } = await loadSubmissionReviewData(id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/submissions"
          className="text-sm text-sage-dark hover:text-sage"
        >
          Back to submissions
        </Link>
        <h1 className="mt-3 font-display text-3xl text-foreground">
          Review submission
        </h1>
        <p className="mt-2 text-sm text-muted">
          Submitted {formatAdminDateTime(submission.created_at)}
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-xl text-foreground">
          {submission.question_text}
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Current status</dt>
            <dd className="font-mono uppercase tracking-wide text-sage">
              {submission.status.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Last updated</dt>
            <dd className="text-foreground">
              {formatAdminDateTime(submission.updated_at)}
            </dd>
          </div>
          {submission.likely_duplicate_of ? (
            <div className="sm:col-span-2">
              <dt className="text-muted">Possible duplicate</dt>
              <dd>
                <Link
                  href={`/admin/cards/${submission.likely_duplicate_of}`}
                  className="text-sage-dark underline"
                >
                  View likely matching card
                </Link>
              </dd>
            </div>
          ) : null}
          {submission.resulting_card_id ? (
            <div className="sm:col-span-2">
              <dt className="text-muted">Linked card</dt>
              <dd>
                <Link
                  href={`/admin/cards/${submission.resulting_card_id}`}
                  className="text-sage-dark underline"
                >
                  View published card
                </Link>
              </dd>
            </div>
          ) : null}
          {submission.decision_notes ? (
            <div className="sm:col-span-2">
              <dt className="text-muted">Decision notes</dt>
              <dd className="text-foreground">{submission.decision_notes}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <SubmissionReviewForm submission={submission} cards={cards} />
    </div>
  );
}
