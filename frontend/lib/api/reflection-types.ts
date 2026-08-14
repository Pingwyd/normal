import type { PaginationMeta } from "@/lib/api/types";

export interface ReflectionTag {
  id: string;
  name: string;
}

export interface ReflectionSummary {
  id: string;
  slug: string;
  title: string;
  brief: string;
  format: "short" | "long";
  tags: ReflectionTag[];
}

export interface ReflectionBlock {
  id: string;
  position: number;
  type: string;
  data: Record<string, unknown>;
  context_note?: string | null;
}

export interface ReflectionDetail extends ReflectionSummary {
  is_crisis_adjacent: boolean;
  reflection_blocks: ReflectionBlock[];
}

export type ReflectionsPage = {
  items: ReflectionSummary[];
  meta: PaginationMeta | null;
};

export type ReflectionsQuery = {
  tag?: string;
  format?: "short" | "long";
  after?: string;
  limit?: number;
};
