"use client";

import { Trash2 } from "lucide-react";

import { DateField } from "@/components/ui/date-field";
import { SelectField } from "@/components/ui/select-field";
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
        <h2 className="font-display text-xl text-foreground">Sources</h2>
        <button
          type="button"
          onClick={() => onChange([...sources, defaultSource()])}
          className="rounded-full border border-border-strong px-3 py-1.5 text-xs font-medium text-sage-dark hover:border-sage"
        >
          Add source
        </button>
      </div>

      {sources.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-sm text-muted">
          No sources yet.
        </p>
      ) : null}

      <div className="space-y-4">
        {sources.map((source, index) => (
          <div
            key={source.localId}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-wide text-sage">
                Source {index + 1}
              </p>
              <button
                type="button"
                aria-label="Remove source"
                onClick={() => removeSource(source.localId)}
                className="rounded border border-border-strong p-1"
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
                className="rounded-lg border border-border-strong px-3 py-2 text-sm sm:col-span-2"
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
                className="rounded-lg border border-border-strong px-3 py-2 text-sm"
                placeholder="Author or organization"
              />
              <input
                required
                value={source.url}
                onChange={(event) =>
                  updateSource(source.localId, { url: event.target.value })
                }
                className="rounded-lg border border-border-strong px-3 py-2 text-sm"
                placeholder="URL"
              />
              <SelectField
                variant="compact"
                aria-label={`Source ${index + 1} tier`}
                value={source.tier}
                onChange={(tier) => updateSource(source.localId, { tier })}
                options={SOURCE_TIERS.map((tier) => ({
                  value: tier,
                  label: getSourceTierLabel(tier),
                }))}
              />
              <DateField
                variant="compact"
                aria-label={`Source ${index + 1} accessed date`}
                value={source.accessed_date}
                onChange={(accessed_date) =>
                  updateSource(source.localId, { accessed_date })
                }
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
