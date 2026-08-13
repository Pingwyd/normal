import { adminApiListRequest, adminApiRequest } from "@/lib/admin/api";

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

export type AdminSubmissionStatus =
  "submitted" | "in_review" | "rejected" | "drafted" | "published";

export type AdminSubmission = {
  id: string;
  question_text: string;
  status: AdminSubmissionStatus;
  likely_duplicate_of: string | null;
  resulting_card_id: string | null;
  handled_by: string | null;
  decision_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminReportedIssueStatus =
  "open" | "in_review" | "resolved" | "dismissed";

export type AdminReportedIssue = {
  id: string;
  card_id: string;
  description: string;
  status: AdminReportedIssueStatus;
  handled_by: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
};

function buildAdminListQuery(options?: {
  status?: string;
  after?: string;
  limit?: number;
}): string {
  const params = new URLSearchParams();
  if (options?.status) {
    params.set("status", options.status);
  }
  if (options?.after) {
    params.set("after", options.after);
  }
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchAdminSubmissions(options?: {
  status?: string;
  after?: string;
  limit?: number;
}) {
  return adminApiListRequest<AdminSubmission[]>(
    `/v1/admin/submissions${buildAdminListQuery(options)}`,
  );
}

export async function fetchAdminSubmission(submissionId: string) {
  return adminApiRequest<AdminSubmission>(
    `/v1/admin/submissions/${submissionId}`,
  );
}

export async function fetchAdminReportedIssues(options?: {
  status?: string;
  after?: string;
  limit?: number;
}) {
  return adminApiListRequest<AdminReportedIssue[]>(
    `/v1/admin/reported-issues${buildAdminListQuery(options)}`,
  );
}

export async function fetchAdminReportedIssue(issueId: string) {
  return adminApiRequest<AdminReportedIssue>(
    `/v1/admin/reported-issues/${issueId}`,
  );
}

export type AdminAffirmationListItem = {
  id: string;
  text: string;
  status: "draft" | "published";
  updated_at: string;
};

export type AdminAffirmationDetail = {
  id: string;
  text: string;
  status: "draft" | "published";
  tag_ids: string[];
  created_at: string;
  updated_at: string;
};

export type AdminQuoteListItem = {
  id: string;
  text: string;
  attributed_to: string;
  status: "draft" | "published";
  updated_at: string;
};

export type AdminQuoteDetail = {
  id: string;
  text: string;
  attributed_to: string;
  source_url: string | null;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

export async function fetchAdminAffirmations(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return adminApiRequest<AdminAffirmationListItem[]>(
    `/v1/admin/affirmations${query}`,
  );
}

export async function fetchAdminAffirmation(affirmationId: string) {
  return adminApiRequest<AdminAffirmationDetail>(
    `/v1/admin/affirmations/${affirmationId}`,
  );
}

export async function fetchAdminQuotes(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return adminApiRequest<AdminQuoteListItem[]>(`/v1/admin/quotes${query}`);
}

export async function fetchAdminQuote(quoteId: string) {
  return adminApiRequest<AdminQuoteDetail>(`/v1/admin/quotes/${quoteId}`);
}
