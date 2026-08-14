"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ContentBlockEditor } from "@/components/admin/content-block-editor";
import { SelectField } from "@/components/ui/select-field";
import {
  createReflectionAction,
  updateReflectionAction,
} from "@/lib/admin/reflection-actions";
import {
  type EditorContentBlock,
  createLocalId,
  reflectionBlocksToPayload,
  validateReflectionBlocksForPublish,
} from "@/lib/admin/card-editor-types";
import type { AdminReflectionDetail, AdminTag } from "@/lib/admin/queries";

type ReflectionFormProps = {
  mode: "create" | "edit";
  reflectionId?: string;
  initialReflection?: AdminReflectionDetail;
  tags: AdminTag[];
};

function mapInitialBlocks(
  reflection?: AdminReflectionDetail,
): EditorContentBlock[] {
  if (!reflection) {
    return [];
  }
  return [...reflection.reflection_blocks]
    .sort((a, b) => a.position - b.position)
    .map((block) => ({
      localId: createLocalId(),
      type: block.type as EditorContentBlock["type"],
      data: block.data,
      context_note: block.context_note ?? "",
    }));
}

export function ReflectionForm({
  mode,
  reflectionId,
  initialReflection,
  tags,
}: ReflectionFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialReflection?.title ?? "");
  const [slug, setSlug] = useState(initialReflection?.slug ?? "");
  const [brief, setBrief] = useState(initialReflection?.brief ?? "");
  const [format, setFormat] = useState<"short" | "long">(
    initialReflection?.format ?? "short",
  );
  const [tagIds, setTagIds] = useState<string[]>(
    initialReflection?.tag_ids ?? [],
  );
  const [isCrisisAdjacent, setIsCrisisAdjacent] = useState(
    initialReflection?.is_crisis_adjacent ?? false,
  );
  const [blocks, setBlocks] = useState<EditorContentBlock[]>(() =>
    mapInitialBlocks(initialReflection),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isLong = format === "long";
  const publicHref =
    initialReflection?.status === "published"
      ? `/reflections/${initialReflection.slug}`
      : null;

  function toggleTag(tagId: string) {
    setTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }

  async function handleSave(status: "draft" | "published") {
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedSlug = slug.trim();
    const trimmedBrief = brief.trim();

    if (!trimmedTitle || !trimmedSlug || !trimmedBrief) {
      setError("Title, slug, and brief are required.");
      return;
    }

    const reflectionBlocks = isLong ? reflectionBlocksToPayload(blocks) : [];

    if (status === "published" && isLong) {
      const blockError = validateReflectionBlocksForPublish(blocks);
      if (blockError) {
        setError(blockError);
        return;
      }
    }

    setIsSaving(true);

    const payload = {
      title: trimmedTitle,
      slug: trimmedSlug,
      brief: trimmedBrief,
      format,
      status,
      is_crisis_adjacent: isCrisisAdjacent,
      tag_ids: tagIds,
      reflection_blocks: reflectionBlocks,
    };

    const result =
      mode === "create"
        ? await createReflectionAction(payload)
        : await updateReflectionAction(reflectionId ?? "", payload);

    setIsSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(`/admin/reflections/${result.id}`);
    router.refresh();
  }

  return (
    <form
      className="space-y-6 rounded-xl border border-border bg-surface p-6"
      onSubmit={(event) => event.preventDefault()}
    >
      {publicHref ? (
        <p className="text-sm text-muted">
          Public page:{" "}
          <Link
            href={publicHref}
            className="font-medium text-sage-dark hover:text-sage"
            target="_blank"
            rel="noopener noreferrer"
          >
            {publicHref}
          </Link>
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="reflection-title" className="text-sm font-medium">
            Title *
          </label>
          <input
            id="reflection-title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="reflection-slug" className="text-sm font-medium">
            Slug *
          </label>
          <input
            id="reflection-slug"
            required
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
          />
        </div>
        <SelectField
          id="reflection-format"
          label="Format"
          required
          value={format}
          onChange={(value) => setFormat(value as "short" | "long")}
          options={[
            {
              value: "short",
              label: "Short (brief is the full content)",
            },
            {
              value: "long",
              label: "Long (body in content blocks)",
            },
          ]}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="reflection-brief" className="text-sm font-medium">
          Brief *
        </label>
        <textarea
          id="reflection-brief"
          required
          rows={4}
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
          placeholder={
            isLong
              ? "Teaser shown on the list page and at the top of the detail page."
              : "Full reflection content shown on the list and detail pages."
          }
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Tags</legend>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const checked = tagIds.includes(tag.id);
            return (
              <label
                key={tag.id}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                  checked
                    ? "border-sage-dark bg-sage-dark text-white"
                    : "border-border-strong bg-surface text-sage-dark"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleTag(tag.id)}
                />
                {tag.name}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={isCrisisAdjacent}
          onChange={(event) => setIsCrisisAdjacent(event.target.checked)}
          className="mt-1"
        />
        <span>
          Crisis-adjacent topic (shows the crisis-resource strip near the top of
          the public page)
        </span>
      </label>

      {isLong ? (
        <ContentBlockEditor
          blocks={blocks}
          onChange={setBlocks}
          showContextNotes
          emptyMessage="No content blocks yet. Add blocks to build the long-form reflection body."
        />
      ) : null}

      {error ? (
        <p className="text-sm text-warning-text" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            void handleSave("draft");
          }}
          className="rounded-full border border-sage-dark bg-surface px-4 py-2 text-sm font-medium text-sage-dark disabled:opacity-60"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            void handleSave("published");
          }}
          className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Publish
        </button>
        <Link
          href="/admin/reflections"
          className="rounded-full border border-border-strong px-4 py-2 text-sm text-sage-dark"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
