"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createQuoteAction,
  updateQuoteAction,
} from "@/lib/admin/daily-content-actions";
import type { AdminQuoteDetail } from "@/lib/admin/queries";

type QuoteFormProps = {
  mode: "create" | "edit";
  quoteId?: string;
  initialQuote?: AdminQuoteDetail;
};

export function QuoteForm({ mode, quoteId, initialQuote }: QuoteFormProps) {
  const router = useRouter();
  const [text, setText] = useState(initialQuote?.text ?? "");
  const [attributedTo, setAttributedTo] = useState(
    initialQuote?.attributed_to ?? "",
  );
  const [sourceUrl, setSourceUrl] = useState(initialQuote?.source_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(status: "draft" | "published") {
    setError(null);

    if (status === "published" && !sourceUrl.trim()) {
      setError("Published quotes require a source URL.");
      return;
    }

    setIsSaving(true);

    const payload = {
      text: text.trim(),
      attributed_to: attributedTo.trim(),
      source_url: sourceUrl.trim() || null,
      status,
    };

    const result =
      mode === "create"
        ? await createQuoteAction(payload)
        : await updateQuoteAction(quoteId ?? "", payload);

    setIsSaving(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(`/admin/quotes/${result.id}`);
    router.refresh();
  }

  return (
    <form
      className="space-y-6 rounded-xl border border-border bg-surface p-6"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="space-y-2">
        <label htmlFor="quote-text" className="text-sm font-medium">
          Text *
        </label>
        <textarea
          id="quote-text"
          required
          rows={5}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="quote-attribution" className="text-sm font-medium">
          Attributed to *
        </label>
        <input
          id="quote-attribution"
          required
          value={attributedTo}
          onChange={(event) => setAttributedTo(event.target.value)}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="quote-source-url" className="text-sm font-medium">
          Source URL
        </label>
        <input
          id="quote-source-url"
          type="url"
          value={sourceUrl}
          onChange={(event) => setSourceUrl(event.target.value)}
          className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted">
          Required before publishing a quote.
        </p>
      </div>

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
          href="/admin/quotes"
          className="rounded-full border border-border-strong px-4 py-2 text-sm text-sage-dark"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
