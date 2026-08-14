import { BlockRenderer } from "@/components/content-blocks/block-renderer";
import type { ReflectionBlock } from "@/lib/api/reflection-types";
import type { ContentBlock } from "@/lib/api/types";

type ReflectionBlockRendererProps = {
  blocks: ReflectionBlock[];
};

const DATA_BLOCK_TYPES = new Set(["chart", "table", "pie_chart"]);

function toContentBlock(block: ReflectionBlock): ContentBlock {
  return {
    id: block.id,
    position: block.position,
    type: block.type,
    data: block.data,
  };
}

function ContextNote({ note }: { note: string }) {
  return (
    <p className="mt-3 border-l-2 border-accent pl-3 text-[13px] leading-relaxed text-ink-secondary">
      {note}
    </p>
  );
}

export function ReflectionBlockRenderer({
  blocks,
}: ReflectionBlockRendererProps) {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      {sorted.map((block) => {
        const showContextNote =
          Boolean(block.context_note?.trim()) &&
          DATA_BLOCK_TYPES.has(block.type);

        return (
          <div key={block.id}>
            <BlockRenderer blocks={[toContentBlock(block)]} />
            {showContextNote ? (
              <ContextNote note={block.context_note!.trim()} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
