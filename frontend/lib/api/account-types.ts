import type { FavoriteContentType } from "@/lib/favorites/keys";
import type { LocalFavoriteItem } from "@/lib/favorites/local-storage";

export type FavoriteCategorySummary = {
  name: string;
  slug: string;
};

export type FavoriteCardContent = {
  question: string;
  slug: string;
  brief: string;
  category: FavoriteCategorySummary;
};

export type FavoriteAffirmationTagSummary = {
  id: string;
  name: string;
};

export type FavoriteAffirmationContent = {
  text: string;
  tags: FavoriteAffirmationTagSummary[];
};

export type FavoriteQuoteContent = {
  text: string;
  attributed_to: string;
  source_url: string | null;
};

export type FavoriteItem = {
  id: string;
  content_type: FavoriteContentType;
  content_id: string;
  created_at: string;
};

export type FavoriteListItem = FavoriteItem & {
  content: FavoriteCardContent | FavoriteAffirmationContent | FavoriteQuoteContent;
};

export type FavoriteToggleResponse = {
  favorited: boolean;
  favorite: FavoriteItem | null;
};

export type AccountPublic = {
  id: string;
  username: string;
  theme_preference: "light" | "dark" | "system";
  layout_version: "classic" | "new";
  created_at: string;
  updated_at: string;
};

export type AccountSignupResponse = {
  account: AccountPublic;
  access_token: string;
  token_type: string;
  recovery_codes: string[];
  favorites: FavoriteItem[];
};

export type AccountSessionResponse = {
  account: AccountPublic;
  access_token: string;
  token_type: string;
  favorites: FavoriteItem[];
};

export type LocalFavoritePayload = LocalFavoriteItem;
