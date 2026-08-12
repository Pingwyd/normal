"use client";

import { Flag, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { ApiRequestError } from "@/lib/api/errors";
import { reportCardIssue } from "@/lib/api/submissions";

const MIN_LENGTH = 10;
const MAX_LENGTH = 2000;

type ReportIssueModalProps = {
  cardId: string;
  cardQuestion: string;
};

export function ReportIssueModal({
  cardId,
  cardQuestion,
}: ReportIssueModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = description.trim().length;
  const isValidLength = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function openModal() {
    setError(null);
    setSuccess(false);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    if (!success) {
      setDescription("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidLength) {
      setError(
        `Please describe the issue in ${MIN_LENGTH} to ${MAX_LENGTH} characters.`,
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await reportCardIssue(cardId, description.trim());
      setSuccess(true);
      setDescription("");
    } catch (submitError) {
      const message =
        submitError instanceof ApiRequestError
          ? submitError.code === "RATE_LIMITED"
            ? "You have sent several reports recently. Please wait a few minutes and try again."
            : submitError.message
          : submitError instanceof Error
            ? submitError.message
            : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 text-sm text-[#5A6560] underline-offset-2 hover:text-[#33473D] hover:underline"
      >
        <Flag size={14} aria-hidden="true" />
        Report an issue with this card
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={closeModal}
        className="fixed inset-0 z-50 m-auto w-[min(100%-2rem,32rem)] max-h-[90vh] overflow-y-auto rounded-xl border border-[#D8D5CC] bg-[#F2F1EC] p-0 shadow-xl backdrop:bg-[#202B26]/40"
      >
        <div className="border-b border-[#D8D5CC] bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="font-display text-xl text-[#202B26]">
                Report an issue
              </h2>
              <p id={descriptionId} className="mt-1 text-sm text-[#5A6560]">
                Flag outdated, unclear, or incorrect information. Reports go to
                our review queue.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full p-1 text-[#5A6560] hover:bg-[#ECEAE4] hover:text-[#202B26]"
              aria-label="Close report dialog"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="rounded-lg border border-[#ECEAE4] bg-white px-3 py-2 text-sm text-[#3A4540]">
            {cardQuestion}
          </p>

          {success ? (
            <div
              className="rounded-lg border border-[#4B6B5E] bg-white px-4 py-3 text-sm text-[#202B26]"
              role="status"
            >
              <p className="font-medium">Report received</p>
              <p className="mt-1 text-[#3A4540]">
                Thank you. We will review this card and follow up if needed.
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="mt-4 rounded-full bg-[#33473D] px-4 py-2 text-sm font-medium text-white"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="issue-description"
                  className="mb-1 block text-sm font-medium"
                >
                  What is wrong? *
                </label>
                <textarea
                  id="issue-description"
                  name="description"
                  rows={5}
                  required
                  minLength={MIN_LENGTH}
                  maxLength={MAX_LENGTH}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe what seems outdated, unclear, or incorrect."
                  className="w-full rounded-lg border border-[#CFCBC2] bg-white px-3 py-2 text-sm leading-relaxed"
                />
                <p className="mt-1 text-xs text-[#5A6560]">
                  {charCount} / {MAX_LENGTH} characters
                </p>
              </div>

              {error ? (
                <p
                  className="rounded-lg border border-[#E8A97A] bg-[#FFF7F0] px-3 py-2 text-sm text-[#202B26]"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-[#CFCBC2] bg-white px-4 py-2.5 text-sm font-medium text-[#33473D]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isValidLength}
                  className="rounded-full bg-[#33473D] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Sending..." : "Send report"}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
