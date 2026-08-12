"use client";

import Link from "next/link";
import { useState } from "react";

import { createSubmission } from "@/lib/api/submissions";
import { ApiRequestError } from "@/lib/api/errors";
import type { LikelyDuplicateMatch } from "@/lib/api/types";

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

type SubmitState =
  | { kind: "idle" }
  | {
      kind: "success";
      submissionId: string;
      duplicate: LikelyDuplicateMatch | null;
    }
  | { kind: "error"; message: string };

function formatQuestionInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^is it normal/i.test(trimmed)) {
    return trimmed.endsWith("?") ? trimmed : `${trimmed}?`;
  }
  const withoutQuestion = trimmed.replace(/\?+$/, "");
  return `Is it normal to ${withoutQuestion}?`;
}

export function SuggestQuestionForm() {
  const [questionText, setQuestionText] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedPreview = formatQuestionInput(questionText);
  const submissionText = formattedPreview;
  const charCount = questionText.trim().length;
  const isValidLength =
    submissionText.length >= MIN_LENGTH && submissionText.length <= MAX_LENGTH;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidLength) {
      setSubmitState({
        kind: "error",
        message: `Please enter between ${MIN_LENGTH} and ${MAX_LENGTH} characters.`,
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ kind: "idle" });

    try {
      const { data, info } = await createSubmission(submissionText);
      setSubmitState({
        kind: "success",
        submissionId: data.id,
        duplicate:
          info?.code === "DUPLICATE_LIKELY" ? data.likely_duplicate : null,
      });
      setQuestionText("");
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.code === "RATE_LIMITED"
            ? "You have sent several suggestions recently. Please wait a few minutes and try again."
            : error.message
          : error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.";
      setSubmitState({ kind: "error", message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitState.kind === "success") {
    return (
      <div className="mx-auto w-full max-w-xl space-y-4 rounded-xl border border-[#D8D5CC] bg-white p-6">
        <h2 className="font-display text-2xl text-[#202B26]">
          Thanks, we received your suggestion
        </h2>
        <p className="text-sm leading-relaxed text-[#3A4540]">
          Your question is in our private review queue. We read every
          submission, but not every suggestion becomes a published card.
        </p>
        {submitState.duplicate ? (
          <div
            className="rounded-lg border border-[#7086C9] bg-[#F4F6FC] px-4 py-3 text-sm text-[#202B26]"
            role="status"
          >
            <p className="font-medium">
              This looks similar to an existing card
            </p>
            <p className="mt-1 text-[#3A4540]">
              We still queued your suggestion for review. You may find this
              helpful in the meantime:
            </p>
            <Link
              href={`/cards/${submitState.duplicate.slug}`}
              className="mt-2 inline-block font-medium text-[#33473D] hover:text-[#4B6B5E]"
            >
              {submitState.duplicate.question}
            </Link>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setSubmitState({ kind: "idle" })}
          className="rounded-full border border-[#33473D] bg-white px-5 py-2.5 text-sm font-medium text-[#33473D] hover:bg-[#33473D] hover:text-white"
        >
          Suggest another question
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-xl space-y-5 rounded-xl border border-[#D8D5CC] bg-white p-6"
    >
      <div className="space-y-2">
        <label htmlFor="question-text" className="block text-sm font-medium">
          Your worry or question *
        </label>
        <textarea
          id="question-text"
          name="question_text"
          rows={4}
          required
          minLength={MIN_LENGTH}
          maxLength={MAX_LENGTH}
          value={questionText}
          onChange={(event) => setQuestionText(event.target.value)}
          placeholder="feel anxious before big events even when I am prepared"
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm leading-relaxed"
          aria-describedby="question-help question-count"
        />
        <p id="question-help" className="text-sm text-[#5A6560]">
          Write the worry in your own words. We will format it as an &quot;Is it
          normal to...&quot; question when you submit.
        </p>
        <div className="flex items-center justify-between gap-4 text-xs text-[#5A6560]">
          <p id="question-count">
            {charCount} / {MAX_LENGTH} characters
          </p>
          {formattedPreview ? (
            <p className="truncate text-[#33473D]">
              Preview: {formattedPreview}
            </p>
          ) : null}
        </div>
      </div>

      {submitState.kind === "error" ? (
        <p
          className="rounded-lg border border-[#E8A97A] bg-[#FFF7F0] px-3 py-2 text-sm text-[#202B26]"
          role="alert"
        >
          {submitState.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || !isValidLength}
        className="w-full rounded-full bg-[#33473D] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Submit suggestion"}
      </button>
    </form>
  );
}
