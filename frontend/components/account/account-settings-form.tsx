"use client";

import Link from "next/link";

import { usePreferences } from "@/components/preferences/preferences-provider";
import type { LayoutVersion, ThemePreference } from "@/lib/preferences/types";

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const LAYOUT_OPTIONS: Array<{ value: LayoutVersion; label: string }> = [
  { value: "classic", label: "Classic" },
  { value: "new", label: "Compact" },
];

function SettingsToggleGroup<T extends string>({
  legend,
  description,
  name,
  value,
  options,
  disabled,
  onChange,
}: {
  legend: string;
  description: string;
  name: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <p className="text-sm leading-relaxed text-muted">{description}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                checked
                  ? "border-sage-dark bg-sage-dark text-white"
                  : "border-border-strong bg-surface text-sage-dark hover:border-sage-dark"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function AccountSettingsForm() {
  const {
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
  } = usePreferences();

  return (
    <div className="mx-auto w-full max-w-xl space-y-8 rounded-xl border border-border bg-surface p-6">
      <div className="space-y-2">
        <h1 className="font-display text-2xl text-foreground">Settings</h1>
        <p className="text-sm leading-relaxed text-muted">
          Theme and layout work on this device without an account. Sign in to
          sync them across devices.
        </p>
        {accountId ? (
          <p className="text-sm text-sage">
            Signed in. Changes sync to your account.
          </p>
        ) : (
          <p className="text-sm text-muted">
            <Link
              href="/account/login?next=/account/settings"
              className="font-medium text-sage-dark hover:text-sage"
            >
              Sign in
            </Link>{" "}
            to sync preferences across devices.
          </p>
        )}
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-warning-border bg-warning-surface px-3 py-2 text-sm text-warning-text">
          {errorMessage}
        </p>
      ) : null}

      <SettingsToggleGroup
        legend="Theme"
        description="Choose light, dark, or match your device setting."
        name="theme"
        value={themePreference}
        options={THEME_OPTIONS}
        disabled={isSaving}
        onChange={(value) => {
          void setThemePreference(value);
        }}
      />

      <SettingsToggleGroup
        legend="Layout"
        description="Classic uses a wider card grid. Compact fits more cards on large screens."
        name="layout"
        value={layoutVersion}
        options={LAYOUT_OPTIONS}
        disabled={isSaving}
        onChange={(value) => {
          void setLayoutVersion(value);
        }}
      />

      <section className="space-y-3 border-t border-border-subtle pt-6">
        <h2 className="text-sm font-medium text-foreground">
          Push notifications
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          Get occasional reminders for affirmations and quotes. You can turn
          this off here at any time.
        </p>

        {!pushSupported ? (
          <p className="text-sm text-muted">
            Push notifications are not supported in this browser.
          </p>
        ) : pushEnabled ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              void disablePushNotifications();
            }}
            className="rounded-full border border-sage-dark bg-surface px-4 py-2 text-sm font-medium text-sage-dark hover:bg-sage-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Disable push notifications
          </button>
        ) : (
          <div className="space-y-2">
            {pushPermission === "denied" ? (
              <p className="text-sm text-muted">
                Notifications are blocked in your browser. Enable them in
                browser settings, then try again.
              </p>
            ) : null}
            <button
              type="button"
              disabled={isSaving || pushPermission === "denied"}
              onClick={() => {
                void enablePushNotifications();
              }}
              className="rounded-full border border-sage-dark bg-sage-dark px-4 py-2 text-sm font-medium text-white hover:bg-sage disabled:cursor-not-allowed disabled:opacity-60"
            >
              Enable push notifications
            </button>
          </div>
        )}
      </section>

      <section className="space-y-3 border-t border-border-subtle pt-6">
        <h2 className="text-sm font-medium text-foreground">
          Affirmations newsletter
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          Optional email updates. This is separate from having an account.
        </p>

        <div>
          <label
            htmlFor="newsletter-email"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            autoComplete="email"
            value={newsletterEmail}
            disabled={isSaving}
            onChange={(event) => setNewsletterEmail(event.target.value)}
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="you@example.com"
          />
        </div>

        {newsletterEnabled ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              void setNewsletterEnabled(false);
            }}
            className="rounded-full border border-sage-dark bg-surface px-4 py-2 text-sm font-medium text-sage-dark hover:bg-sage-dark hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Unsubscribe from newsletter
          </button>
        ) : (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => {
              void setNewsletterEnabled(true);
            }}
            className="rounded-full border border-sage-dark bg-sage-dark px-4 py-2 text-sm font-medium text-white hover:bg-sage disabled:cursor-not-allowed disabled:opacity-60"
          >
            Subscribe to newsletter
          </button>
        )}
      </section>
    </div>
  );
}
