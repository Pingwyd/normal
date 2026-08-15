"use client";

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

type ContentLifecycleConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isSubmitting?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ContentLifecycleConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  isSubmitting = false,
  destructive = false,
  onConfirm,
  onCancel,
}: ContentLifecycleConfirmDialogProps) {
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
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-warning-text"
              aria-hidden="true"
            />
            <div>
              <h2 id={titleId} className="font-display text-xl text-foreground">
                {title}
              </h2>
              <p id={descriptionId} className="mt-1 text-sm text-muted">
                {description}
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
          className={`rounded-full px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
            destructive ? "bg-warning-text" : "bg-sage-dark"
          }`}
        >
          {isSubmitting ? "Working..." : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
