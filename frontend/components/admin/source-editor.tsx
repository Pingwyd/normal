"use client";

import { Trash2 } from "lucide-react";

import {
  type EditorSource,
  defaultSource,
} from "@/lib/admin/card-editor-types";
import { getSourceTierLabel } from "@/lib/source-tiers";

const SOURCE_TIERS = [
  "peer_reviewed",
  "expert_written",
  "self_report",
] as const;

type SourceEditorProps = {
  sources: EditorSource[];
  onChange: (sources: EditorSource[]) => void;
};

export function SourceEditor({ sources, onChange }: SourceEditorProps) {
  function updateSource(localId: string, patch: Partial<EditorSource>) {
    onChange(
      sources.map((source) =>
        source.localId === localId ? { ...source, ...patch } : source,
      ),
    );
  }

  function removeSource(localId: string) {
    onChange(sources.filter((source) => source.localId !== localId));
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl text-[#202B26]">Sources</h2>
        <button
          type="button"
          onClick={() => onChange([...sources, defaultSource()])}
          className="rounded-full border border-[#CFCBC2] px-3 py-1.5 text-xs font-medium text-[#33473D] hover:border-[#4B6B5E]"
        >
          Add source
        </button>
      </div>

      {sources.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#CFCBC2] px-4 py-6 text-sm text-[#5A6560]">
          No sources yet.
        </p>
      ) : null}

      <div className="space-y-4">
        {sources.map((source, index) => (
          <div
            key={source.localId}
            className="rounded-xl border border-[#D8D5CC] bg-white p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-wide text-[#4B6B5E]">
                Source {index + 1}
              </p>
              <button
                type="button"
                aria-label="Remove source"
                onClick={() => removeSource(source.localId)}
                className="rounded border border-[#CFCBC2] p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                required
                value={source.title}
                onChange={(event) =>
                  updateSource(source.localId, { title: event.target.value })
                }
                className="rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm sm:col-span-2"
                placeholder="Title"
              />
              <input
                required
                value={source.author_or_org}
                onChange={(event) =>
                  updateSource(source.localId, {
                    author_or_org: event.target.value,
                  })
                }
                className="rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
                placeholder="Author or organization"
              />
              <input
                required
                value={source.url}
                onChange={(event) =>
                  updateSource(source.localId, { url: event.target.value })
                }
                className="rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
                placeholder="URL"
              />
              <select
                value={source.tier}
                onChange={(event) =>
                  updateSource(source.localId, { tier: event.target.value })
                }
                className="rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
              >
                {SOURCE_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {getSourceTierLabel(tier)}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={source.accessed_date}
                onChange={(event) =>
                  updateSource(source.localId, {
                    accessed_date: event.target.value,
                  })
                }
                className="rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
