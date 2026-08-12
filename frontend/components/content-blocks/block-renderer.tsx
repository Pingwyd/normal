import type { ContentBlock } from "@/lib/api/types";

import { ChartBlock } from "./chart-block";
import { ParagraphBlock } from "./paragraph-block";
import { PieChartBlock } from "./pie-chart-block";
import { QuoteCalloutBlock } from "./quote-callout-block";
import { TableBlock } from "./table-block";

type BlockRendererProps = {
  blocks: ContentBlock[];
};

function renderBlock(block: ContentBlock) {
  switch (block.type) {
    case "paragraph":
      return <ParagraphBlock data={block.data} />;
    case "chart":
      return <ChartBlock data={block.data} />;
    case "table":
      return <TableBlock data={block.data} />;
    case "pie_chart":
      return <PieChartBlock data={block.data} />;
    case "quote_callout":
      return <QuoteCalloutBlock data={block.data} />;
    default:
      if (process.env.NODE_ENV === "development") {
        console.warn(`Unknown content block type: ${block.type}`);
      }
      return null;
  }
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  const sorted = [...blocks].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      {sorted.map((block) => (
        <div key={block.id}>{renderBlock(block)}</div>
      ))}
    </div>
  );
}
