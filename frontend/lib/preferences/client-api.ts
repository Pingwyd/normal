import type { AccountPublic } from "@/lib/api/account-types";
import type { LayoutVersion, ThemePreference } from "@/lib/preferences/types";

export type AccountPreferencesPatch = {
  theme_preference?: ThemePreference;
  layout_version?: LayoutVersion;
};

export async function fetchAccountProfile(): Promise<AccountPublic | null> {
  const response = await fetch("/api/account/me", {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Could not load account preferences.");
  }

  const body = (await response.json()) as {
    data: AccountPublic | null;
    error: { code: string; message: string } | null;
  };

  if (body.error || !body.data) {
    throw new Error(body.error?.message ?? "Could not load account preferences.");
  }

  return body.data;
}

export async function patchAccountPreferences(
  patch: AccountPreferencesPatch,
): Promise<AccountPublic> {
  const response = await fetch("/api/account/me", {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });

  const body = (await response.json()) as {
    data: AccountPublic | null;
    error: { code: string; message: string } | null;
  };

  if (!response.ok || body.error || !body.data) {
    throw new Error(body.error?.message ?? "Could not save preferences.");
  }

  return body.data;
}
