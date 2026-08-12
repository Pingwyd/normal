"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import {
  CONTENT_BLOCK_TYPES,
  type ContentBlockType,
  type EditorContentBlock,
  createLocalId,
  defaultBlockData,
} from "@/lib/admin/card-editor-types";

type ContentBlockEditorProps = {
  blocks: EditorContentBlock[];
  onChange: (blocks: EditorContentBlock[]) => void;
};

export function ContentBlockEditor({
  blocks,
  onChange,
}: ContentBlockEditorProps) {
  function updateBlock(localId: string, patch: Partial<EditorContentBlock>) {
    onChange(
      blocks.map((block) =>
        block.localId === localId ? { ...block, ...patch } : block,
      ),
    );
  }

  function updateBlockData(localId: string, data: Record<string, unknown>) {
    updateBlock(localId, { data });
  }

  function moveBlock(localId: string, direction: -1 | 1) {
    const index = blocks.findIndex((block) => block.localId === localId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= blocks.length) {
      return;
    }
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  function removeBlock(localId: string) {
    onChange(blocks.filter((block) => block.localId !== localId));
  }

  function addBlock(type: ContentBlockType) {
    onChange([
      ...blocks,
      { localId: createLocalId(), type, data: defaultBlockData(type) },
    ]);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl text-[#202B26]">Content blocks</h2>
        <div className="flex flex-wrap gap-2">
          {CONTENT_BLOCK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="rounded-full border border-[#CFCBC2] px-3 py-1.5 text-xs font-medium text-[#33473D] hover:border-[#4B6B5E]"
            >
              Add {type.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#CFCBC2] px-4 py-6 text-sm text-[#5A6560]">
          No content blocks yet. Add one to build the card body.
        </p>
      ) : null}

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <div
            key={block.localId}
            className="rounded-xl border border-[#D8D5CC] bg-white p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs uppercase tracking-wide text-[#4B6B5E]">
                {index + 1}. {block.type.replaceAll("_", " ")}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Move block up"
                  disabled={index === 0}
                  onClick={() => moveBlock(block.localId, -1)}
                  className="rounded border border-[#CFCBC2] p-1 disabled:opacity-40"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Move block down"
                  disabled={index === blocks.length - 1}
                  onClick={() => moveBlock(block.localId, 1)}
                  className="rounded border border-[#CFCBC2] p-1 disabled:opacity-40"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Remove block"
                  onClick={() => removeBlock(block.localId)}
                  className="rounded border border-[#CFCBC2] p-1 text-[#33473D]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <BlockFields
              block={block}
              onChange={(data) => updateBlockData(block.localId, data)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: EditorContentBlock;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const data = block.data;

  if (block.type === "paragraph") {
    return (
      <textarea
        rows={4}
        value={String(data.text ?? "")}
        onChange={(event) => onChange({ ...data, text: event.target.value })}
        className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
        placeholder="Paragraph text"
      />
    );
  }

  if (block.type === "quote_callout") {
    return (
      <div className="space-y-2">
        <textarea
          rows={3}
          value={String(data.text ?? "")}
          onChange={(event) => onChange({ ...data, text: event.target.value })}
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
          placeholder="Quote text"
        />
        <input
          value={String(data.attribution ?? "")}
          onChange={(event) =>
            onChange({ ...data, attribution: event.target.value })
          }
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
          placeholder="Attribution (optional)"
        />
      </div>
    );
  }

  if (block.type === "chart") {
    const points = Array.isArray(data.points)
      ? (data.points as Array<{ label: string; value: number }>)
      : [];
    return (
      <ChartLikeEditor
        data={data}
        points={points}
        onChange={onChange}
        pointLabel="Point label"
      />
    );
  }

  if (block.type === "pie_chart") {
    const segments = Array.isArray(data.segments)
      ? (data.segments as Array<{ label: string; value: number }>)
      : [];
    return (
      <ChartLikeEditor
        data={data}
        points={segments}
        onChange={onChange}
        pointLabel="Segment label"
        pointsKey="segments"
      />
    );
  }

  const headers = Array.isArray(data.headers)
    ? (data.headers as string[])
    : [""];
  const rows = Array.isArray(data.rows) ? (data.rows as string[][]) : [[""]];

  return (
    <div className="space-y-2">
      <input
        value={String(data.caption ?? "")}
        onChange={(event) => onChange({ ...data, caption: event.target.value })}
        className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
        placeholder="Table caption (optional)"
      />
      <input
        value={headers.join(", ")}
        onChange={(event) =>
          onChange({
            ...data,
            headers: event.target.value.split(",").map((item) => item.trim()),
          })
        }
        className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
        placeholder="Headers, comma separated"
      />
      {rows.map((row, rowIndex) => (
        <input
          key={rowIndex}
          value={row.join(", ")}
          onChange={(event) => {
            const nextRows = [...rows];
            nextRows[rowIndex] = event.target.value
              .split(",")
              .map((item) => item.trim());
            onChange({ ...data, headers, rows: nextRows });
          }}
          className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
          placeholder={`Row ${rowIndex + 1}, comma separated`}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...data, headers, rows: [...rows, [""]] })}
        className="text-sm text-[#33473D] underline"
      >
        Add row
      </button>
    </div>
  );
}

function ChartLikeEditor({
  data,
  points,
  onChange,
  pointLabel,
  pointsKey = "points",
}: {
  data: Record<string, unknown>;
  points: Array<{ label: string; value: number }>;
  onChange: (data: Record<string, unknown>) => void;
  pointLabel: string;
  pointsKey?: "points" | "segments";
}) {
  return (
    <div className="space-y-2">
      <input
        value={String(data.title ?? "")}
        onChange={(event) => onChange({ ...data, title: event.target.value })}
        className="w-full rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
        placeholder="Title (optional)"
      />
      {pointsKey === "points" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={String(data.x_label ?? "")}
            onChange={(event) =>
              onChange({ ...data, x_label: event.target.value })
            }
            className="rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
            placeholder="X label"
          />
          <input
            value={String(data.y_label ?? "")}
            onChange={(event) =>
              onChange({ ...data, y_label: event.target.value })
            }
            className="rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
            placeholder="Y label"
          />
        </div>
      ) : null}
      {points.map((point, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-2">
          <input
            value={point.label}
            onChange={(event) => {
              const next = [...points];
              next[index] = { ...next[index], label: event.target.value };
              onChange({ ...data, [pointsKey]: next });
            }}
            className="rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
            placeholder={pointLabel}
          />
          <input
            type="number"
            value={point.value}
            onChange={(event) => {
              const next = [...points];
              next[index] = {
                ...next[index],
                value: Number(event.target.value) || 0,
              };
              onChange({ ...data, [pointsKey]: next });
            }}
            className="rounded-lg border border-[#CFCBC2] px-3 py-2 text-sm"
            placeholder="Value"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            ...data,
            [pointsKey]: [...points, { label: "", value: 0 }],
          })
        }
        className="text-sm text-[#33473D] underline"
      >
        Add {pointsKey === "segments" ? "segment" : "point"}
      </button>
    </div>
  );
}
