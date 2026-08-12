export interface ApiErrorBody {
  code: string;
  message: string;
}

export interface ApiEnvelope<T> {
  data: T | null;
  meta: PaginationMeta | null;
  error: ApiErrorBody | null;
}

export interface PaginationMeta {
  next_cursor: string;
  has_more: boolean;
}

export interface CategorySummary {
  name: string;
  slug: string;
}

export interface CardSummary {
  id: string;
  slug: string;
  question: string;
  brief: string;
  category: CategorySummary;
  save_count: number;
  like_count: number;
  source_count: number;
  last_reviewed_at: string | null;
}

export interface ContentBlock {
  id: string;
  position: number;
  type: string;
  data: Record<string, unknown>;
}

export interface Source {
  id: string;
  title: string;
  author_or_org: string;
  url: string;
  tier: string;
  published_date: string | null;
  accessed_date: string;
  metadata: Record<string, unknown>;
}

export interface RelatedCard {
  id: string;
  slug: string;
  question: string;
  brief: string;
}

export interface CardDetail extends CardSummary {
  content_blocks: ContentBlock[];
  sources: Source[];
  related_cards: RelatedCard[];
}

export interface BrowseSearchParams {
  q?: string;
  category?: string;
  tags?: string;
  after?: string;
  limit?: number;
}

export interface LikelyDuplicateMatch {
  id: string;
  question: string;
  slug: string;
  similarity_score: number;
}

export interface SubmissionCreateResponse {
  id: string;
  status: string;
  likely_duplicate_of: string | null;
  likely_duplicate: LikelyDuplicateMatch | null;
}

export interface ReportIssueCreateResponse {
  id: string;
  status: string;
}
