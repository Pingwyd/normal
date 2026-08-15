import type { PaginationMeta } from "@/lib/api/types";

export type DailyContentStatus = "draft" | "published" | "unpublished";

export type TagSummary = {
  id: string;
  name: string;
};

export type AffirmationSummary = {
  id: string;
  text: string;
  tags: TagSummary[];
};

export type QuoteSummary = {
  id: string;
  text: string;
  attributed_to: string;
  source_url: string | null;
};

export type AdminAffirmationListItem = {
  id: string;
  text: string;
  status: DailyContentStatus;
  updated_at: string;
};

export type AdminAffirmationDetail = {
  id: string;
  text: string;
  status: DailyContentStatus;
  tag_ids: string[];
  created_at: string;
  updated_at: string;
};

export type AdminQuoteListItem = {
  id: string;
  text: string;
  attributed_to: string;
  status: DailyContentStatus;
  updated_at: string;
};

export type AdminQuoteDetail = {
  id: string;
  text: string;
  attributed_to: string;
  source_url: string | null;
  status: DailyContentStatus;
  created_at: string;
  updated_at: string;
};

export type DailyContentPage<T> = {
  items: T[];
  meta: PaginationMeta | null;
};
