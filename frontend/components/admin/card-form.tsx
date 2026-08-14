"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ContentBlockEditor } from "@/components/admin/content-block-editor";
import { SourceEditor } from "@/components/admin/source-editor";
import { SelectField } from "@/components/ui/select-field";
import {
  createCardAction,
  updateCardAction,
  type CardFormPayload,
} from "@/lib/admin/card-actions";
import {
  type EditorContentBlock,
  type EditorSource,
  blocksToPayload,
  createLocalId,
  getClinicalPublishMessage,
} from "@/lib/admin/card-editor-types";
import type {
  AdminCardDetail,
  AdminCategory,
  AdminTag,
} from "@/lib/admin/queries";

type CardFormProps = {
  mode: "create" | "edit";
  cardId?: string;
  initialCard?: AdminCardDetail;
  categories: AdminCategory[];
  tags: AdminTag[];
  role: "founder" | "clinical_reviewer";
};

function mapInitialBlocks(card?: AdminCardDetail): EditorContentBlock[] {
  if (!card) {
    return [];
  }
  return [...card.content_blocks]
    .sort((a, b) => a.position - b.position)
    .map((block) => ({
      localId: createLocalId(),
      type: block.type as EditorContentBlock["type"],
      data: block.data,
    }));
}

function mapInitialSources(card?: AdminCardDetail): EditorSource[] {
  if (!card) {
    return [];
  }
  return card.sources.map((source) => ({
    localId: createLocalId(),
    title: source.title,
    author_or_org: source.author_or_org,
    url: source.url,
    tier: source.tier,
    published_date: source.published_date ?? "",
    accessed_date: source.accessed_date,
  }));
}

export function CardForm({
  mode,
  cardId,
  initialCard,
  categories,
  tags,
  role,
}: CardFormProps) {
  const router = useRouter();
  const [question, setQuestion] = useState(initialCard?.question ?? "");
  const [brief, setBrief] = useState(initialCard?.brief ?? "");
  const [slug, setSlug] = useState(initialCard?.slug ?? "");
  const [categoryId, setCategoryId] = useState(
    initialCard?.category_id ?? categories[0]?.id ?? "",
  );
  const [tagIds, setTagIds] = useState<string[]>(initialCard?.tag_ids ?? []);
  const [requiresClinicalReview, setRequiresClinicalReview] = useState(
    initialCard?.requires_clinical_review ?? false,
  );
  const [blocks, setBlocks] = useState<EditorContentBlock[]>(
    mapInitialBlocks(initialCard),
  );
  const [sources, setSources] = useState<EditorSource[]>(
    mapInitialSources(initialCard),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const founderBlockedFromPublish =
    role === "founder" && requiresClinicalReview;

  function buildPayload(status: CardFormPayload["status"]): CardFormPayload {
    return {
      category_id: categoryId,
      question: question.trim(),
      brief: brief.trim(),
      slug: slug.trim(),
      status,
      requires_clinical_review: requiresClinicalReview,
      tag_ids: tagIds,
      content_blocks: blocksToPayload(blocks),
      sources: sources.map((source) => ({
        title: source.title.trim(),
        author_or_org: source.author_or_org.trim(),
        url: source.url.trim(),
        tier: source.tier,
        published_date: source.published_date || null,
        accessed_date: source.accessed_date,
        metadata: {},
      })),
    };
  }

  async function handleSave(status: CardFormPayload["status"]) {
    if (founderBlockedFromPublish && status === "published") {
      setError(getClinicalPublishMessage(role));
      return;
    }

    setIsSaving(true);
    setError(null);
    const payload = buildPayload(status);

    const result =
      mode === "create"
        ? await createCardAction(payload)
        : await updateCardAction(cardId!, payload, requiresClinicalReview);

    if (!result.ok) {
      setError(
        result.clinicalGate ? getClinicalPublishMessage(role) : result.message,
      );
      setIsSaving(false);
      return;
    }

    router.push(`/admin/cards/${result.cardId}`);
    router.refresh();
  }

  function toggleTag(tagId: string) {
    setTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-xl text-foreground">Core fields</h2>
        <div className="grid gap-4">
          <label className="block text-sm">
            Question
            <input
              required
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border-strong px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Brief answer
            <textarea
              required
              rows={3}
              value={brief}
              onChange={(event) => setBrief(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border-strong px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Slug
            <input
              required
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="mt-1 w-full rounded-lg border border-border-strong px-3 py-2"
            />
          </label>
          <SelectField
            id="card-category"
            label="Category"
            required
            value={categoryId}
            onChange={setCategoryId}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
          <fieldset>
            <legend className="text-sm font-medium">Tags</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="inline-flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={tagIds.includes(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  {tag.name}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={requiresClinicalReview}
              onChange={(event) =>
                setRequiresClinicalReview(event.target.checked)
              }
            />
            Requires clinical review before publish
          </label>
        </div>
      </section>

      <ContentBlockEditor blocks={blocks} onChange={setBlocks} />
      <SourceEditor sources={sources} onChange={setSources} />

      {error ? (
        <p
          className="rounded-lg border border-warning-border bg-warning-surface px-4 py-3 text-sm text-foreground"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {founderBlockedFromPublish ? (
        <p className="text-sm text-muted">{getClinicalPublishMessage(role)}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleSave("draft")}
          className="rounded-full border border-sage-dark px-5 py-2.5 text-sm font-medium text-sage-dark disabled:opacity-60"
        >
          Save draft
        </button>
        <button
          type="button"
          disabled={isSaving || founderBlockedFromPublish}
          onClick={() => handleSave("published")}
          className="rounded-full bg-sage-dark px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Publish
        </button>
        <Link
          href="/admin/cards"
          className="rounded-full px-5 py-2.5 text-sm text-muted hover:text-sage-dark"
        >
          Cancel
        </Link>
      </div>
    </div>
  );
}
