import type { AccountPublic } from "@/lib/api/account-types";
import type { LocalPreferences } from "@/lib/preferences/types";

export function isAccountPreferencesAtDefaults(
  account: AccountPublic,
): boolean {
  return (
    account.theme_preference === "system" &&
    account.layout_version === "classic"
  );
}

export function shouldClaimLocalPreferences(
  account: AccountPublic,
  local: LocalPreferences,
): boolean {
  if (!isAccountPreferencesAtDefaults(account)) {
    return false;
  }

  return (
    local.theme_preference !== "system" || local.layout_version !== "classic"
  );
}
