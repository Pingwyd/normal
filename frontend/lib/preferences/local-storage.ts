import {
  DEFAULT_LOCAL_PREFERENCES,
  type LayoutVersion,
  type LocalPreferences,
  type ThemePreference,
} from "@/lib/preferences/types";

export const LOCAL_PREFERENCES_STORAGE_KEY = "normal:local_preferences";
export const PUSH_PROMPT_DISMISSED_KEY = "normal:push_prompt_dismissed";

const THEME_VALUES: ThemePreference[] = ["light", "dark", "system"];
const LAYOUT_VALUES: LayoutVersion[] = ["classic", "new"];

function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" && THEME_VALUES.includes(value as ThemePreference)
  );
}

function isLayoutVersion(value: unknown): value is LayoutVersion {
  return (
    typeof value === "string" && LAYOUT_VALUES.includes(value as LayoutVersion)
  );
}

export function readLocalPreferences(): LocalPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_LOCAL_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_LOCAL_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<LocalPreferences>;
    return {
      theme_preference: isThemePreference(parsed.theme_preference)
        ? parsed.theme_preference
        : DEFAULT_LOCAL_PREFERENCES.theme_preference,
      layout_version: isLayoutVersion(parsed.layout_version)
        ? parsed.layout_version
        : DEFAULT_LOCAL_PREFERENCES.layout_version,
      newsletter_email:
        typeof parsed.newsletter_email === "string"
          ? parsed.newsletter_email
          : DEFAULT_LOCAL_PREFERENCES.newsletter_email,
      newsletter_enabled:
        typeof parsed.newsletter_enabled === "boolean"
          ? parsed.newsletter_enabled
          : DEFAULT_LOCAL_PREFERENCES.newsletter_enabled,
    };
  } catch {
    return DEFAULT_LOCAL_PREFERENCES;
  }
}

export function writeLocalPreferences(preferences: LocalPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    LOCAL_PREFERENCES_STORAGE_KEY,
    JSON.stringify(preferences),
  );
}

export function readPushPromptDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY) === "1";
}

export function writePushPromptDismissed(dismissed: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  if (dismissed) {
    window.localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, "1");
  } else {
    window.localStorage.removeItem(PUSH_PROMPT_DISMISSED_KEY);
  }
}
