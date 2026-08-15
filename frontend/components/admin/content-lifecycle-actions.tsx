"use client";

import { EyeOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ContentLifecycleConfirmDialog } from "@/components/admin/content-lifecycle-confirm-dialog";
import { deleteCardAction, updateCardAction } from "@/lib/admin/card-actions";
import {
  deleteAffirmationAction,
  deleteQuoteAction,
  updateAffirmationAction,
  updateQuoteAction,
} from "@/lib/admin/daily-content-actions";
import {
  deleteReflectionAction,
  updateReflectionAction,
} from "@/lib/admin/reflection-actions";

export type ContentLifecycleContentType =
  "card" | "affirmation" | "quote" | "reflection";

export type ContentLifecycleStatus = "draft" | "published" | "unpublished";

const CONTENT_LABELS: Record<ContentLifecycleContentType, string> = {
  card: "card",
  affirmation: "affirmation",
  quote: "quote",
  reflection: "reflection",
};

const LIST_HREFS: Record<ContentLifecycleContentType, string> = {
  card: "/admin/cards",
  affirmation: "/admin/affirmations",
  quote: "/admin/quotes",
  reflection: "/admin/reflections",
};

type ContentLifecycleActionsProps = {
  contentType: ContentLifecycleContentType;
  contentId: string;
  status: ContentLifecycleStatus;
  deletable: boolean;
  disabled?: boolean;
  requiresClinicalReview?: boolean;
};

type PendingAction = "unpublish" | "delete" | null;

export function ContentLifecycleActions({
  contentType,
  contentId,
  status,
  deletable,
  disabled = false,
  requiresClinicalReview = false,
}: ContentLifecycleActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = CONTENT_LABELS[contentType];
  const listHref = LIST_HREFS[contentType];
  const showUnpublish = status === "published";
  const showDelete = deletable;
  const showDeleteBlockedNote = !deletable;

  async function runUnpublish() {
    setIsSubmitting(true);
    setError(null);

    let result: { ok: true } | { ok: false; message: string };

    if (contentType === "card") {
      const cardResult = await updateCardAction(
        contentId,
        { status: "unpublished" },
        requiresClinicalReview,
      );
      result = cardResult.ok
        ? { ok: true }
        : { ok: false, message: cardResult.message };
    } else if (contentType === "affirmation") {
      const affirmationResult = await updateAffirmationAction(contentId, {
        status: "unpublished",
      });
      result = affirmationResult.ok
        ? { ok: true }
        : { ok: false, message: affirmationResult.message };
    } else if (contentType === "quote") {
      const quoteResult = await updateQuoteAction(contentId, {
        status: "unpublished",
      });
      result = quoteResult.ok
        ? { ok: true }
        : { ok: false, message: quoteResult.message };
    } else {
      const reflectionResult = await updateReflectionAction(contentId, {
        status: "unpublished",
      });
      result = reflectionResult.ok
        ? { ok: true }
        : { ok: false, message: reflectionResult.message };
    }

    setIsSubmitting(false);
    setPendingAction(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.refresh();
  }

  async function runDelete() {
    setIsSubmitting(true);
    setError(null);

    let result: { ok: true } | { ok: false; message: string };

    if (contentType === "card") {
      const cardResult = await deleteCardAction(contentId);
      result = cardResult.ok
        ? { ok: true }
        : { ok: false, message: cardResult.message };
    } else if (contentType === "affirmation") {
      const affirmationResult = await deleteAffirmationAction(contentId);
      result = affirmationResult.ok
        ? { ok: true }
        : { ok: false, message: affirmationResult.message };
    } else if (contentType === "quote") {
      const quoteResult = await deleteQuoteAction(contentId);
      result = quoteResult.ok
        ? { ok: true }
        : { ok: false, message: quoteResult.message };
    } else {
      const reflectionResult = await deleteReflectionAction(contentId);
      result = reflectionResult.ok
        ? { ok: true }
        : { ok: false, message: reflectionResult.message };
    }

    setIsSubmitting(false);
    setPendingAction(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(listHref);
    router.refresh();
  }

  if (!showUnpublish && !showDelete && !showDeleteBlockedNote) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-medium text-foreground">Lifecycle actions</h2>

      {showDeleteBlockedNote ? (
        <p className="text-sm text-muted">
          Delete is only available for drafts that were never published. Use
          unpublish to remove this {label} from the public site while keeping
          its history.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-warning-text" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {showUnpublish ? (
          <button
            type="button"
            disabled={disabled || isSubmitting}
            onClick={() => setPendingAction("unpublish")}
            className="inline-flex items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-sage-dark disabled:opacity-60"
          >
            <EyeOff size={16} aria-hidden="true" />
            Unpublish
          </button>
        ) : null}

        {showDelete ? (
          <button
            type="button"
            disabled={disabled || isSubmitting}
            onClick={() => setPendingAction("delete")}
            className="inline-flex items-center gap-2 rounded-full border border-warning-border bg-warning-surface px-4 py-2 text-sm font-medium text-warning-text disabled:opacity-60"
          >
            <Trash2 size={16} aria-hidden="true" />
            Delete draft
          </button>
        ) : null}
      </div>

      <ContentLifecycleConfirmDialog
        isOpen={pendingAction === "unpublish"}
        title={`Unpublish this ${label}?`}
        description={`This ${label} will disappear from the public site immediately. Saved items will show as no longer available until you publish it again.`}
        confirmLabel="Unpublish"
        isSubmitting={isSubmitting}
        onConfirm={() => {
          void runUnpublish();
        }}
        onCancel={() => {
          if (!isSubmitting) {
            setPendingAction(null);
          }
        }}
      />

      <ContentLifecycleConfirmDialog
        isOpen={pendingAction === "delete"}
        title={`Delete this ${label}?`}
        description={`This permanently removes the ${label} and cannot be undone. Only use this for drafts that were never published.`}
        confirmLabel="Delete permanently"
        destructive
        isSubmitting={isSubmitting}
        onConfirm={() => {
          void runDelete();
        }}
        onCancel={() => {
          if (!isSubmitting) {
            setPendingAction(null);
          }
        }}
      />
    </section>
  );
}
