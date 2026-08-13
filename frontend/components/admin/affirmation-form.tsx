"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createAffirmationAction,
  updateAffirmationAction,
} from "@/lib/admin/daily-content-actions";
import type { AdminAffirmationDetail, AdminTag } from "@/lib/admin/queries";

type AffirmationFormProps = {
  mode: "create" | "edit";
  affirmationId?: string;
  initialAffirmation?: AdminAffirmationDetail;
  tags: AdminTag[];
};

export function AffirmationForm({
  mode,
  affirmationId,
  initialAffirmation,
  tags,
}: AffirmationFormProps) {
  const router = useRouter();
  const [text, setText] = useState(initialAffirmation?.text ?? "");
  const [tagIds, setTagIds] = useState<string[]>(
    initialAffirmation?.tag_ids ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function toggleTag(tagId: string) {
    setTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }

  async function handleSave(status: "draft" | "published") {
    setError(null);
    setIsSaving(true);

    const payload = {
      text: text.trim(),
      status,
      tag_ids: tagIds,
    };

    const result =
      mode === "create"
        ? await createAffirmationAction(payload)
        : await updateAffirmationAction(affirmationId ?? "", payload);

    setIsSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(`/admin/affirmations/${result.id}`);
    router.refresh();
  }

  return (
    <form
      className="space-y-6 rounded-xl border border-[#D8D5CC] bg-white p-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="space-y-2">
        <label htmlFor="affirmation-text" className="text-sm font-medium">
          Text *
        </label>
        <textarea
          id="affirmation-text"
          required
          rows={5}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
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
                    ? "border-[#33473D] bg-[#33473D] text-white"
                    : "border-[#CFCBC2] bg-white text-[#33473D]"
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

      {error ? (
        <p className="text-sm text-[#8A4B2A]" role="alert">
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
          className="rounded-full border border-[#33473D] bg-white px-4 py-2 text-sm font-medium text-[#33473D] disabled:opacity-60"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            void handleSave("published");
          }}
          className="rounded-full bg-[#33473D] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Publish
        </button>
        <Link
          href="/admin/affirmations"
          className="rounded-full border border-[#CFCBC2] px-4 py-2 text-sm text-[#33473D]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
