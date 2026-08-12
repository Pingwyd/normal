"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateReportedIssueAction } from "@/lib/admin/submission-actions";
import type {
  AdminReportedIssue,
  AdminReportedIssueStatus,
} from "@/lib/admin/queries";

const STATUS_OPTIONS: { value: AdminReportedIssueStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

type ReportedIssueReviewFormProps = {
  issue: AdminReportedIssue;
  cardQuestion?: string | null;
};

export function ReportedIssueReviewForm({
  issue,
  cardQuestion,
}: ReportedIssueReviewFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AdminReportedIssueStatus>(issue.status);
  const [resolutionNotes, setResolutionNotes] = useState(
    issue.resolution_notes ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await updateReportedIssueAction(issue.id, {
      status,
      resolution_notes: resolutionNotes.trim() || undefined,
    });

    if (!result.ok) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    router.refresh();
    setIsSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-[#D8D5CC] bg-white p-6"
    >
      <div className="rounded-lg border border-[#ECEAE4] bg-[#F7F6F2] px-4 py-3 text-sm leading-relaxed text-[#3A4540]">
        {issue.description}
      </div>

      <p className="text-sm text-[#5A6560]">
        Reported against{" "}
        <Link
          href={`/admin/cards/${issue.card_id}`}
          className="font-medium text-[#33473D] underline"
        >
          {cardQuestion ?? "View card"}
        </Link>
      </p>

      <div>
        <label
          htmlFor="issue-status"
          className="mb-1 block text-sm font-medium"
        >
          Status *
        </label>
        <select
          id="issue-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as AdminReportedIssueStatus)
          }
          className="w-full rounded-lg border border-[#CFCBC2] bg-white px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="resolution-notes"
          className="mb-1 block text-sm font-medium"
        >
          Resolution notes
        </label>
        <textarea
          id="resolution-notes"
          rows={4}
          value={resolutionNotes}
          onChange={(event) => setResolutionNotes(event.target.value)}
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm leading-relaxed"
          placeholder="What changed, or why this report was dismissed."
        />
      </div>

      {error ? (
        <p
          className="rounded-lg border border-[#E8A97A] bg-[#FFF7F0] px-3 py-2 text-sm text-[#202B26]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-[#33473D] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save resolution"}
      </button>
    </form>
  );
}
