export type ThemePreference = "light" | "dark" | "system";
export type LayoutVersion = "classic" | "new";

export type LocalPreferences = {
  theme_preference: ThemePreference;
  layout_version: LayoutVersion;
  newsletter_email: string;
  newsletter_enabled: boolean;
};

export const DEFAULT_LOCAL_PREFERENCES: LocalPreferences = {
  theme_preference: "system",
  layout_version: "classic",
  newsletter_email: "",
  newsletter_enabled: false,
};
