"use client";

import { Tag, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type DraftMissingTagsDialogProps = {
  isOpen: boolean;
  missingTags: string[];
  isSubmitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DraftMissingTagsDialog({
  isOpen,
  missingTags,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: DraftMissingTagsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

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

  if (missingTags.length === 0) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onCancel}
      className="fixed inset-0 z-50 m-auto w-[min(100%-2rem,32rem)] max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-background p-0 shadow-xl backdrop:bg-foreground/40"
    >
      <div className="border-b border-border bg-surface px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Tag
              size={20}
              className="mt-0.5 shrink-0 text-sage-dark"
              aria-hidden="true"
            />
            <div>
              <h2 id={titleId} className="font-display text-xl text-foreground">
                Create new tags?
              </h2>
              <p id={descriptionId} className="mt-1 text-sm text-muted">
                This draft references tags that are not in the app yet. Confirm
                to create them and continue with the import.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-full p-1 text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-60"
            aria-label="Close"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        <ul className="flex flex-wrap gap-2">
          {missingTags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-border bg-surface-muted px-3 py-1 text-sm text-foreground"
            >
              {tag}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          You can also create tags manually under Admin &gt; Tags before
          importing.
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-full border border-border-strong px-4 py-2 text-sm text-sage-dark disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Creating tags..." : "Create tags and continue"}
        </button>
      </div>
    </dialog>
  );
}
