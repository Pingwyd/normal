export interface BrowseCategory {
  name: string;
  slug: string | null;
}

export const BROWSE_CATEGORIES: BrowseCategory[] = [
  { name: "All", slug: null },
  { name: "Mind & Emotions", slug: "mind-emotions" },
  { name: "Body & Health", slug: "body-health" },
  { name: "Relationships", slug: "relationships" },
];
