"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { AccountPublic } from "@/lib/api/account-types";
import { upsertPushSubscription, updateNewsletterSubscription } from "@/lib/notifications/client-api";
import { shouldClaimLocalPreferences } from "@/lib/preferences/claim";
import {
  fetchAccountProfile,
  patchAccountPreferences,
} from "@/lib/preferences/client-api";
import {
  readLocalPreferences,
  writeLocalPreferences,
} from "@/lib/preferences/local-storage";
import type { LayoutVersion, ThemePreference } from "@/lib/preferences/types";
import {
  getExistingPushSubscription,
  getPushPermissionState,
  isPushSupported,
  pushSubscriptionToPayload,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from "@/lib/push/subscribe";
import { fetchAccountSession } from "@/lib/favorites/client-api";

type PreferencesContextValue = {
  accountId: string | null;
  themePreference: ThemePreference;
  layoutVersion: LayoutVersion;
  newsletterEmail: string;
  newsletterEnabled: boolean;
  pushSupported: boolean;
  pushPermission: NotificationPermission | "unsupported";
  pushEnabled: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  setThemePreference: (value: ThemePreference) => Promise<void>;
  setLayoutVersion: (value: LayoutVersion) => Promise<void>;
  setNewsletterEmail: (value: string) => void;
  setNewsletterEnabled: (enabled: boolean) => Promise<void>;
  enablePushNotifications: () => Promise<void>;
  disablePushNotifications: () => Promise<void>;
  applyAuthenticatedSession: (account: AccountPublic) => Promise<void>;
  clearAuthenticatedSession: () => void;
  syncPushSubscriptionForSession: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function resolveThemeClass(themePreference: ThemePreference): "light" | "dark" {
  if (themePreference === "dark") {
    return "dark";
  }
  if (themePreference === "light") {
    return "light";
  }

  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyDocumentPreferences(
  themePreference: ThemePreference,
  layoutVersion: LayoutVersion,
): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = themePreference;
  document.documentElement.dataset.themeResolved = resolveThemeClass(
    themePreference,
  );
  document.body.dataset.layout = layoutVersion;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    () =>
      typeof window !== "undefined"
        ? readLocalPreferences().theme_preference
        : "system",
  );
  const [layoutVersion, setLayoutVersionState] = useState<LayoutVersion>(() =>
    typeof window !== "undefined"
      ? readLocalPreferences().layout_version
      : "classic",
  );
  const [newsletterEmail, setNewsletterEmailState] = useState(() =>
    typeof window !== "undefined" ? readLocalPreferences().newsletter_email : "",
  );
  const [newsletterEnabled, setNewsletterEnabledState] = useState(() =>
    typeof window !== "undefined"
      ? readLocalPreferences().newsletter_enabled
      : false,
  );
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPermission, setPushPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeAccountIdRef = useRef<string | null>(null);

  const pushSupported = isPushSupported();

  const refreshPushState = useCallback(async () => {
    if (!pushSupported) {
      setPushPermission("unsupported");
      setPushEnabled(false);
      return;
    }

    setPushPermission(getPushPermissionState());
    const subscription = await getExistingPushSubscription();
    setPushEnabled(Boolean(subscription) && Notification.permission === "granted");
  }, [pushSupported]);

  const persistLocalSnapshot = useCallback(
    (snapshot: {
      theme_preference: ThemePreference;
      layout_version: LayoutVersion;
      newsletter_email: string;
      newsletter_enabled: boolean;
    }) => {
      writeLocalPreferences(snapshot);
    },
    [],
  );

  const applyPreferenceState = useCallback(
    (
      nextTheme: ThemePreference,
      nextLayout: LayoutVersion,
      local: ReturnType<typeof readLocalPreferences>,
    ) => {
      setThemePreferenceState(nextTheme);
      setLayoutVersionState(nextLayout);
      setNewsletterEmailState(local.newsletter_email);
      setNewsletterEnabledState(local.newsletter_enabled);
      applyDocumentPreferences(nextTheme, nextLayout);
      persistLocalSnapshot({
        theme_preference: nextTheme,
        layout_version: nextLayout,
        newsletter_email: local.newsletter_email,
        newsletter_enabled: local.newsletter_enabled,
      });
    },
    [persistLocalSnapshot],
  );

  const loadAnonymousPreferences = useCallback(() => {
    const local = readLocalPreferences();
    applyPreferenceState(
      local.theme_preference,
      local.layout_version,
      local,
    );
  }, [applyPreferenceState]);

  const loadAuthenticatedPreferences = useCallback(
    async (nextAccountId: string) => {
      activeAccountIdRef.current = nextAccountId;
      setAccountId(nextAccountId);

      const account = await fetchAccountProfile();
      if (activeAccountIdRef.current !== nextAccountId || !account) {
        return;
      }

      const local = readLocalPreferences();
      applyPreferenceState(
        account.theme_preference,
        account.layout_version,
        local,
      );
    },
    [applyPreferenceState],
  );

  const syncPushSubscriptionForSession = useCallback(async () => {
    if (!pushSupported) {
      return;
    }

    const subscription = await getExistingPushSubscription();
    if (!subscription || Notification.permission !== "granted") {
      return;
    }

    await upsertPushSubscription({
      ...pushSubscriptionToPayload(subscription),
      enabled: true,
    });
    await refreshPushState();
  }, [pushSupported, refreshPushState]);

  useEffect(() => {
    const local = readLocalPreferences();
    applyDocumentPreferences(local.theme_preference, local.layout_version);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await refreshPushState();
        const session = await fetchAccountSession();
        if (cancelled) {
          return;
        }

        if (session) {
          await loadAuthenticatedPreferences(session.id);
          if (!cancelled) {
            await syncPushSubscriptionForSession();
          }
        } else {
          activeAccountIdRef.current = null;
          setAccountId(null);
        }
      } catch {
        if (!cancelled) {
          loadAnonymousPreferences();
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadAnonymousPreferences, loadAuthenticatedPreferences, refreshPushState, syncPushSubscriptionForSession]);

  useEffect(() => {
    if (themePreference !== "system" || typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      applyDocumentPreferences(themePreference, layoutVersion);
    };

    media.addEventListener("change", handleChange);
    return () => {
      media.removeEventListener("change", handleChange);
    };
  }, [themePreference, layoutVersion]);

  const setThemePreference = useCallback(
    async (value: ThemePreference) => {
      setErrorMessage(null);
      setIsSaving(true);
      const activeAccountId = activeAccountIdRef.current;
      const local = readLocalPreferences();

      try {
        if (activeAccountId) {
          const account = await patchAccountPreferences({
            theme_preference: value,
          });
          if (activeAccountIdRef.current !== activeAccountId) {
            return;
          }
          applyPreferenceState(
            account.theme_preference,
            account.layout_version,
            local,
          );
          return;
        }

        applyPreferenceState(value, layoutVersion, {
          ...local,
          theme_preference: value,
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not save theme.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [applyPreferenceState, layoutVersion],
  );

  const setLayoutVersion = useCallback(
    async (value: LayoutVersion) => {
      setErrorMessage(null);
      setIsSaving(true);
      const activeAccountId = activeAccountIdRef.current;
      const local = readLocalPreferences();

      try {
        if (activeAccountId) {
          const account = await patchAccountPreferences({
            layout_version: value,
          });
          if (activeAccountIdRef.current !== activeAccountId) {
            return;
          }
          applyPreferenceState(
            account.theme_preference,
            account.layout_version,
            local,
          );
          return;
        }

        applyPreferenceState(themePreference, value, {
          ...local,
          layout_version: value,
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Could not save layout.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [applyPreferenceState, themePreference],
  );

  const setNewsletterEmail = useCallback((value: string) => {
    setNewsletterEmailState(value);
    const local = readLocalPreferences();
    persistLocalSnapshot({
      ...local,
      newsletter_email: value,
    });
  }, [persistLocalSnapshot]);

  const setNewsletterEnabled = useCallback(
    async (enabled: boolean) => {
      setErrorMessage(null);
      setIsSaving(true);
      const trimmedEmail = newsletterEmail.trim();

      if (enabled && !trimmedEmail) {
        setErrorMessage("Enter an email address to subscribe.");
        setIsSaving(false);
        return;
      }

      try {
        const result = await updateNewsletterSubscription(trimmedEmail, enabled);
        setNewsletterEmailState(result.email);
        setNewsletterEnabledState(result.enabled);
        const local = readLocalPreferences();
        persistLocalSnapshot({
          ...local,
          newsletter_email: result.email,
          newsletter_enabled: result.enabled,
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not update newsletter settings.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [newsletterEmail, persistLocalSnapshot],
  );

  const enablePushNotifications = useCallback(async () => {
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const subscription = await subscribeToPushNotifications();
      await upsertPushSubscription({
        ...pushSubscriptionToPayload(subscription),
        enabled: true,
      });
      await refreshPushState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not enable push notifications.",
      );
      await refreshPushState();
    } finally {
      setIsSaving(false);
    }
  }, [refreshPushState]);

  const disablePushNotifications = useCallback(async () => {
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const subscription = await getExistingPushSubscription();
      if (subscription) {
        await upsertPushSubscription({
          ...pushSubscriptionToPayload(subscription),
          enabled: false,
        });
      }
      await unsubscribeFromPushNotifications();
      await refreshPushState();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not disable push notifications.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [refreshPushState]);

  const applyAuthenticatedSession = useCallback(
    async (account: AccountPublic) => {
      setErrorMessage(null);
      const local = readLocalPreferences();
      let nextAccount = account;

      if (shouldClaimLocalPreferences(account, local)) {
        nextAccount = await patchAccountPreferences({
          theme_preference: local.theme_preference,
          layout_version: local.layout_version,
        });
      }

      activeAccountIdRef.current = nextAccount.id;
      setAccountId(nextAccount.id);
      applyPreferenceState(
        nextAccount.theme_preference,
        nextAccount.layout_version,
        local,
      );
      await syncPushSubscriptionForSession();
      await refreshPushState();
    },
    [applyPreferenceState, refreshPushState, syncPushSubscriptionForSession],
  );

  const clearAuthenticatedSession = useCallback(() => {
    activeAccountIdRef.current = null;
    setAccountId(null);
    loadAnonymousPreferences();
    void (async () => {
      await refreshPushState();
      if (!pushSupported) {
        return;
      }

      const subscription = await getExistingPushSubscription();
      if (subscription && Notification.permission === "granted") {
        await upsertPushSubscription({
          ...pushSubscriptionToPayload(subscription),
          enabled: true,
        });
      }
    })();
  }, [loadAnonymousPreferences, pushSupported, refreshPushState]);

  const value = useMemo(
    () => ({
      accountId,
      themePreference,
      layoutVersion,
      newsletterEmail,
      newsletterEnabled,
      pushSupported,
      pushPermission,
      pushEnabled,
      isSaving,
      errorMessage,
      setThemePreference,
      setLayoutVersion,
      setNewsletterEmail,
      setNewsletterEnabled,
      enablePushNotifications,
      disablePushNotifications,
      applyAuthenticatedSession,
      clearAuthenticatedSession,
      syncPushSubscriptionForSession,
    }),
    [
      accountId,
      themePreference,
      layoutVersion,
      newsletterEmail,
      newsletterEnabled,
      pushSupported,
      pushPermission,
      pushEnabled,
      isSaving,
      errorMessage,
      setThemePreference,
      setLayoutVersion,
      setNewsletterEmail,
      setNewsletterEnabled,
      enablePushNotifications,
      disablePushNotifications,
      applyAuthenticatedSession,
      clearAuthenticatedSession,
      syncPushSubscriptionForSession,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider.");
  }
  return context;
}
