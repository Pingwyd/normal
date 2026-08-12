"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateSubmissionAction } from "@/lib/admin/submission-actions";
import type {
  AdminCardListItem,
  AdminSubmission,
  AdminSubmissionStatus,
} from "@/lib/admin/queries";

const STATUS_OPTIONS: { value: AdminSubmissionStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In review" },
  { value: "drafted", label: "Drafted" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

type SubmissionReviewFormProps = {
  submission: AdminSubmission;
  cards: AdminCardListItem[];
};

export function SubmissionReviewForm({
  submission,
  cards,
}: SubmissionReviewFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<AdminSubmissionStatus>(
    submission.status,
  );
  const [decisionNotes, setDecisionNotes] = useState(
    submission.decision_notes ?? "",
  );
  const [resultingCardId, setResultingCardId] = useState(
    submission.resulting_card_id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (status === "published" && !resultingCardId.trim()) {
      setError(
        "Choose the published card that answers this submission before marking it published.",
      );
      return;
    }

    setIsSubmitting(true);
    const result = await updateSubmissionAction(submission.id, {
      status,
      decision_notes: decisionNotes.trim() || undefined,
      resulting_card_id:
        status === "published" ? resultingCardId.trim() : undefined,
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
      <div>
        <label
          htmlFor="submission-status"
          className="mb-1 block text-sm font-medium"
        >
          Status *
        </label>
        <select
          id="submission-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as AdminSubmissionStatus)
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

      {status === "published" ? (
        <div>
          <label
            htmlFor="resulting-card-id"
            className="mb-1 block text-sm font-medium"
          >
            Published card *
          </label>
          <select
            id="resulting-card-id"
            value={resultingCardId}
            onChange={(event) => setResultingCardId(event.target.value)}
            required
            className="w-full rounded-lg border border-[#CFCBC2] bg-white px-3 py-2 text-sm"
          >
            <option value="">Select a card</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.question}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[#5A6560]">
            Publishing never auto-creates a card. Link the submission to an
            existing published card, or{" "}
            <Link href="/admin/cards/new" className="text-[#33473D] underline">
              create one first
            </Link>
            .
          </p>
        </div>
      ) : null}

      <div>
        <label
          htmlFor="decision-notes"
          className="mb-1 block text-sm font-medium"
        >
          Decision notes
        </label>
        <textarea
          id="decision-notes"
          rows={4}
          value={decisionNotes}
          onChange={(event) => setDecisionNotes(event.target.value)}
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm leading-relaxed"
          placeholder="Internal notes about this decision."
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
        {isSubmitting ? "Saving..." : "Save review"}
      </button>
    </form>
  );
}
