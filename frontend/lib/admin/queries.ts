import { adminApiRequest } from "@/lib/admin/api";

export type AdminCardListItem = {
  id: string;
  slug: string;
  question: string;
  brief: string;
  status: "draft" | "published" | "unpublished";
  requires_clinical_review: boolean;
  category_id: string;
  updated_at: string;
};

export type DueForReviewCard = {
  id: string;
  slug: string;
  question: string;
  status: "draft" | "published" | "unpublished";
  next_review_due: string | null;
  last_reviewed_at: string | null;
  requires_clinical_review: boolean;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  phase: number;
  requires_clinical_review: boolean;
};

export type AdminTag = {
  id: string;
  name: string;
};

export type AdminCardDetail = {
  id: string;
  category_id: string;
  question: string;
  brief: string;
  slug: string;
  status: "draft" | "published" | "unpublished";
  requires_clinical_review: boolean;
  tag_ids: string[];
  content_blocks: Array<{
    id: string;
    position: number;
    type: string;
    data: Record<string, unknown>;
  }>;
  sources: Array<{
    id: string;
    title: string;
    author_or_org: string;
    url: string;
    tier: string;
    published_date: string | null;
    accessed_date: string;
    metadata: Record<string, unknown>;
  }>;
};

export async function fetchAdminCards(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return adminApiRequest<AdminCardListItem[]>(`/v1/admin/cards${query}`);
}

export async function fetchDueForReviewCards() {
  return adminApiRequest<DueForReviewCard[]>("/v1/admin/cards/due-for-review");
}

export async function fetchAdminCard(cardId: string) {
  return adminApiRequest<AdminCardDetail>(`/v1/admin/cards/${cardId}`);
}

export async function fetchAdminCategories() {
  return adminApiRequest<AdminCategory[]>("/v1/admin/categories");
}

export async function fetchAdminTags() {
  return adminApiRequest<AdminTag[]>("/v1/admin/tags");
}
