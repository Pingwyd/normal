"use client";

import { FileUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { DraftMissingTagsDialog } from "@/components/admin/draft-missing-tags-dialog";
import {
  importCardDraftAction,
  type CardDraftImportPayload,
} from "@/lib/admin/card-import-actions";
import { findMissingDraftTags } from "@/lib/admin/draft-tags";

function parseDraftFile(text: string): CardDraftImportPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The file is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("The draft file must be a JSON object.");
  }

  const draft = parsed as Record<string, unknown>;
  if (typeof draft.question !== "string" || !draft.question.trim()) {
    throw new Error(
      'The draft file must include a non-empty "question" field.',
    );
  }
  if (typeof draft.brief !== "string" || !draft.brief.trim()) {
    throw new Error('The draft file must include a non-empty "brief" field.');
  }
  if (
    typeof draft.suggested_category !== "string" ||
    !draft.suggested_category.trim()
  ) {
    throw new Error(
      'The draft file must include a non-empty "suggested_category" field.',
    );
  }

  return parsed as CardDraftImportPayload;
}

export function CardDraftImportForm({
  existingTagNames,
}: {
  existingTagNames: string[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [pendingPayload, setPendingPayload] =
    useState<CardDraftImportPayload | null>(null);
  const [missingTags, setMissingTags] = useState<string[]>([]);
  const [showTagDialog, setShowTagDialog] = useState(false);

  async function runImport(
    payload: CardDraftImportPayload,
    createMissingTags: boolean,
  ) {
    const result = await importCardDraftAction(payload, { createMissingTags });
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/admin/cards/${result.cardId}`);
    router.refresh();
  }

  async function handleImport() {
    setError(null);
    const input = inputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      setError("Choose a JSON draft file to import.");
      return;
    }

    setIsImporting(true);
    try {
      const text = await file.text();
      const payload = parseDraftFile(text);
      const missing = findMissingDraftTags(
        payload.suggested_tags,
        existingTagNames,
      );

      if (missing.length > 0) {
        setPendingPayload(payload);
        setMissingTags(missing);
        setShowTagDialog(true);
        return;
      }

      await runImport(payload, false);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Could not read the draft file.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function handleConfirmMissingTags() {
    if (!pendingPayload) {
      return;
    }

    setIsImporting(true);
    setError(null);
    try {
      await runImport(pendingPayload, true);
      setShowTagDialog(false);
      setPendingPayload(null);
      setMissingTags([]);
    } finally {
      setIsImporting(false);
    }
  }

  function handleCancelMissingTags() {
    setShowTagDialog(false);
    setPendingPayload(null);
    setMissingTags([]);
  }

  return (
    <>
      <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted">
            Upload a JSON file from{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 text-xs">
              content-drafts/
            </code>
            . Imported cards always land as drafts for human review. New tags
            are created only after you confirm.
          </p>
          <label
            htmlFor="card-draft-file"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-muted/40 px-6 py-10 text-center transition-colors hover:border-sage hover:bg-surface-muted/70"
          >
            <FileUp size={28} className="text-sage-dark" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">
              {fileName ?? "Choose draft JSON file"}
            </span>
            <span className="text-xs text-muted">.json files only</span>
            <input
              ref={inputRef}
              id="card-draft-file"
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const nextFile = event.target.files?.[0];
                setFileName(nextFile?.name ?? null);
                setError(null);
              }}
            />
          </label>
        </div>

        {error ? (
          <p className="text-sm text-warning-text" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isImporting}
            onClick={() => {
              void handleImport();
            }}
            className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isImporting ? "Importing..." : "Import as draft"}
          </button>
          <Link
            href="/admin/cards"
            className="rounded-full border border-border-strong px-4 py-2 text-sm text-sage-dark"
          >
            Cancel
          </Link>
          <Link
            href="/admin/tags"
            className="rounded-full border border-border-strong px-4 py-2 text-sm text-sage-dark"
          >
            Manage tags
          </Link>
        </div>
      </div>

      <DraftMissingTagsDialog
        isOpen={showTagDialog}
        missingTags={missingTags}
        isSubmitting={isImporting}
        onConfirm={() => {
          void handleConfirmMissingTags();
        }}
        onCancel={handleCancelMissingTags}
      />
    </>
  );
}
