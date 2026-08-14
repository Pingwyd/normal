"use client";

import { KeyRound, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { SelectField } from "@/components/ui/select-field";
import {
  createDraftFromResearchJobAction,
  deleteResearchProviderKeyAction,
  fetchResearchJobAction,
  saveResearchProviderKeyAction,
  startResearchJobAction,
  type ResearchJob,
  type ResearchProviderOption,
} from "@/lib/admin/research-actions";

type CardResearchPanelProps = {
  initialProviders: ResearchProviderOption[];
};

export function CardResearchPanel({ initialProviders }: CardResearchPanelProps) {
  const router = useRouter();
  const [providers, setProviders] =
    useState<ResearchProviderOption[]>(initialProviders);
  const [provider, setProvider] = useState(initialProviders[0]?.provider ?? "");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [question, setQuestion] = useState("");
  const [activeJob, setActiveJob] = useState<ResearchJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);

  const selectedProvider = useMemo(
    () => providers.find((item) => item.provider === provider) ?? null,
    [providers, provider],
  );

  const providerOptions = useMemo(
    () =>
      providers.map((item) => ({
        value: item.provider,
        label: item.configured
          ? `${item.label} (${item.key_hint ?? "saved"})`
          : item.label,
      })),
    [providers],
  );

  const pollJob = useCallback(async (jobId: string) => {
    const result = await fetchResearchJobAction(jobId);
    if (!result.ok) {
      setError(result.message);
      return null;
    }
    setActiveJob(result.job);
    return result.job;
  }, []);

  useEffect(() => {
    if (!activeJob || activeJob.status !== "pending") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void pollJob(activeJob.id);
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [activeJob, pollJob]);

  async function handleSaveKey() {
    setError(null);
    if (!provider) {
      setError("Choose a provider first.");
      return;
    }
    if (!apiKeyInput.trim()) {
      setError("Enter an API key to save.");
      return;
    }

    setIsSavingKey(true);
    const result = await saveResearchProviderKeyAction(provider, apiKeyInput);
    setIsSavingKey(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (result.provider) {
      setProviders((current) =>
        current.map((item) =>
          item.provider === result.provider!.provider
            ? result.provider!
            : item,
        ),
      );
    }
    setApiKeyInput("");
  }

  async function handleRemoveKey() {
    if (!provider) {
      return;
    }
    setError(null);
    setIsSavingKey(true);
    const result = await deleteResearchProviderKeyAction(provider);
    setIsSavingKey(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setProviders((current) =>
      current.map((item) =>
        item.provider === provider
          ? { ...item, configured: false, key_hint: null }
          : item,
      ),
    );
    setApiKeyInput("");
  }

  async function handleStartResearch() {
    setError(null);
    if (!selectedProvider?.configured) {
      setError("Save an API key for this provider before starting research.");
      return;
    }
    if (!question.trim()) {
      setError("Enter a question to research.");
      return;
    }

    setIsStarting(true);
    const result = await startResearchJobAction(question.trim(), provider);
    setIsStarting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setActiveJob(result.job);
  }

  async function handleCreateDraft() {
    if (!activeJob || activeJob.status !== "complete") {
      return;
    }
    setError(null);
    setIsCreatingDraft(true);
    const result = await createDraftFromResearchJobAction(activeJob.id);
    setIsCreatingDraft(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    router.push(`/admin/cards/${result.cardId}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-sage-dark" aria-hidden="true" />
          <h2 className="text-lg font-medium text-foreground">Provider and API key</h2>
        </div>
        <p className="text-sm text-muted">
          Keys are encrypted on the server and stored per provider. Switch providers
          anytime; saved keys stay available when you switch back.
        </p>

        <SelectField
          id="research-provider"
          label="Research provider"
          value={provider}
          onChange={(value) => {
            setProvider(value);
            setApiKeyInput("");
            setError(null);
          }}
          options={providerOptions}
        />

        {selectedProvider?.configured ? (
          <p className="text-sm text-muted">
            Saved key:{" "}
            <span className="font-mono text-foreground">
              {selectedProvider.key_hint ?? "configured"}
            </span>
          </p>
        ) : null}

        <label className="block space-y-2 text-sm">
          <span className="font-medium">
            {selectedProvider?.configured ? "Replace API key" : "API key *"}
          </span>
          <input
            type="password"
            value={apiKeyInput}
            onChange={(event) => setApiKeyInput(event.target.value)}
            autoComplete="off"
            placeholder={
              selectedProvider?.configured
                ? "Paste a new key to replace the saved one"
                : "Paste provider API key"
            }
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isSavingKey}
            onClick={() => {
              void handleSaveKey();
            }}
            className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSavingKey ? "Saving..." : "Save API key"}
          </button>
          {selectedProvider?.configured ? (
            <button
              type="button"
              disabled={isSavingKey}
              onClick={() => {
                void handleRemoveKey();
              }}
              className="rounded-full border border-border-strong px-4 py-2 text-sm text-sage-dark disabled:opacity-60"
            >
              Remove saved key
            </button>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-sage-dark" aria-hidden="true" />
          <h2 className="text-lg font-medium text-foreground">Research question</h2>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="font-medium">Question *</span>
          <textarea
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Is it normal to feel anxious for no reason?"
            className="w-full rounded-lg border border-border-strong px-3 py-2 text-sm"
          />
        </label>

        <button
          type="button"
          disabled={isStarting || activeJob?.status === "pending"}
          onClick={() => {
            void handleStartResearch();
          }}
          className="inline-flex items-center gap-2 rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {isStarting || activeJob?.status === "pending" ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : null}
          {activeJob?.status === "pending" ? "Researching..." : "Start research"}
        </button>
      </section>

      {activeJob ? (
        <section className="space-y-3 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-medium text-foreground">Job status</h2>
          <p className="text-sm text-muted">
            Provider: {activeJob.provider} · Status:{" "}
            <span className="font-mono uppercase text-sage">{activeJob.status}</span>
          </p>

          {activeJob.status === "pending" ? (
            <p className="text-sm text-muted">Research is running. This can take a minute.</p>
          ) : null}

          {activeJob.status === "failed" ? (
            <p className="text-sm text-warning-text" role="alert">
              {activeJob.error_message ?? "Research failed."}
            </p>
          ) : null}

          {activeJob.status === "complete" && activeJob.result ? (
            <>
              <pre className="max-h-72 overflow-auto rounded-lg bg-surface-muted p-4 text-xs text-foreground">
                {JSON.stringify(activeJob.result, null, 2)}
              </pre>
              <button
                type="button"
                disabled={isCreatingDraft}
                onClick={() => {
                  void handleCreateDraft();
                }}
                className="rounded-full bg-sage-dark px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {isCreatingDraft ? "Creating draft..." : "Create draft card"}
              </button>
            </>
          ) : null}
        </section>
      ) : null}

      {error ? (
        <p className="text-sm text-warning-text" role="alert">
          {error}
        </p>
      ) : null}

      <Link
        href="/admin/cards/import"
        className="inline-block text-sm text-sage-dark underline"
      >
        Or import a Cursor draft JSON file instead
      </Link>
    </div>
  );
}
