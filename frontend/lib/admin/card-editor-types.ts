export const CONTENT_BLOCK_TYPES = [
  "paragraph",
  "chart",
  "table",
  "pie_chart",
  "quote_callout",
] as const;

export type ContentBlockType = (typeof CONTENT_BLOCK_TYPES)[number];

export type EditorContentBlock = {
  localId: string;
  type: ContentBlockType;
  data: Record<string, unknown>;
};

export type EditorSource = {
  localId: string;
  title: string;
  author_or_org: string;
  url: string;
  tier: string;
  published_date: string;
  accessed_date: string;
};

export function createLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function defaultBlockData(type: ContentBlockType): Record<string, unknown> {
  switch (type) {
    case "paragraph":
      return { text: "" };
    case "chart":
      return {
        title: "",
        x_label: "",
        y_label: "",
        points: [{ label: "", value: 0 }],
      };
    case "table":
      return {
        caption: "",
        headers: ["Column 1", "Column 2"],
        rows: [["", ""]],
      };
    case "pie_chart":
      return {
        title: "",
        segments: [{ label: "", value: 0 }],
      };
    case "quote_callout":
      return { text: "", attribution: "" };
    default:
      return {};
  }
}

export function defaultSource(): EditorSource {
  const today = new Date().toISOString().slice(0, 10);
  return {
    localId: createLocalId(),
    title: "",
    author_or_org: "",
    url: "",
    tier: "expert_written",
    published_date: "",
    accessed_date: today,
  };
}

export function blocksToPayload(blocks: EditorContentBlock[]) {
  return blocks.map((block, index) => ({
    position: index + 1,
    type: block.type,
    data: block.data,
  }));
}

export function getClinicalPublishMessage(role: string): string {
  if (role === "founder") {
    return "This card requires clinical review before publish. Only a clinical reviewer can publish it while this flag is on.";
  }
  return "You do not have permission to publish this card.";
}
