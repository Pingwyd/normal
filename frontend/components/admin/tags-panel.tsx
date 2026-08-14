"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createAdminTagAction,
  deleteAdminTagAction,
} from "@/lib/admin/tag-actions";
import type { AdminTag } from "@/lib/admin/queries";

type TagsPanelProps = {
  initialTags: AdminTag[];
};

export function TagsPanel({ initialTags }: TagsPanelProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a tag name.");
      return;
    }

    setIsCreating(true);
    const result = await createAdminTagAction(trimmed);
    setIsCreating(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setName("");
    router.refresh();
  }

  async function handleDelete(tagId: string, tagName: string) {
    const confirmed = window.confirm(
      `Delete the tag "${tagName}"? Cards already using it will keep their links until you edit them.`,
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setDeletingId(tagId);
    const result = await deleteAdminTagAction(tagId);
    setDeletingId(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          void handleCreate(event);
        }}
        className="space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-medium text-foreground">Add tag</h2>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Tag name *</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. anxiety"
            className="w-full max-w-md rounded-lg border border-border-strong px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={isCreating}
          className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isCreating ? "Creating..." : "Create tag"}
        </button>
      </form>

      {error ? (
        <p className="text-sm text-warning-text" role="alert">
          {error}
        </p>
      ) : null}

      {initialTags.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-10 text-center text-sm text-muted">
          No tags yet. Create one above or confirm tag creation when importing a
          draft.
        </p>
      ) : (
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface">
          {initialTags.map((tag) => (
            <li
              key={tag.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <span className="font-medium text-foreground">{tag.name}</span>
              <button
                type="button"
                disabled={deletingId === tag.id}
                onClick={() => {
                  void handleDelete(tag.id, tag.name);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border-strong px-3 py-1.5 text-sm text-sage-dark disabled:opacity-60"
              >
                <Trash2 size={14} aria-hidden="true" />
                {deletingId === tag.id ? "Deleting..." : "Delete"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
