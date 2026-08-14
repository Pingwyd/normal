"use client";

import { useEffect, useMemo, useState } from "react";

const HERO_PROMPTS = [
  "feel anxious for no reason?",
  "still think about an old friendship?",
  "cry over something small?",
  "feel behind everyone else?",
];

const TYPE_MS = 32;
const ERASE_MS = 18;
const PAUSE_MS = 2400;

function longestPrompt(prompts: string[]): string {
  return prompts.reduce(
    (longest, current) => (current.length > longest.length ? current : longest),
    prompts[0] ?? "",
  );
}

export function HeroSection() {
  const sizingPrompt = useMemo(() => longestPrompt(HERO_PROMPTS), []);
  const [promptIndex, setPromptIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showReassurance, setShowReassurance] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const displayText = prefersReducedMotion
    ? (HERO_PROMPTS[0] ?? "")
    : typedText;
  const displayReassurance = prefersReducedMotion || showReassurance;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      setPrefersReducedMotion(media.matches);
    };

    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    let cancelled = false;
    const prompt = HERO_PROMPTS[promptIndex];

    function typePrompt(onComplete: () => void) {
      let index = 0;
      setTypedText("");
      setShowReassurance(false);

      const intervalId = window.setInterval(() => {
        if (cancelled) {
          window.clearInterval(intervalId);
          return;
        }
        index += 1;
        setTypedText(prompt.slice(0, index));
        if (index >= prompt.length) {
          window.clearInterval(intervalId);
          onComplete();
        }
      }, TYPE_MS);
    }

    function erasePrompt(onComplete: () => void) {
      let text = prompt;
      const intervalId = window.setInterval(() => {
        if (cancelled) {
          window.clearInterval(intervalId);
          return;
        }
        text = text.slice(0, -1);
        setTypedText(text);
        if (text.length === 0) {
          window.clearInterval(intervalId);
          onComplete();
        }
      }, ERASE_MS);
    }

    typePrompt(() => {
      window.setTimeout(() => {
        if (!cancelled) {
          setShowReassurance(true);
        }
      }, 200);

      window.setTimeout(() => {
        if (cancelled) {
          return;
        }
        setShowReassurance(false);
        erasePrompt(() => {
          if (!cancelled) {
            setPromptIndex((current) => (current + 1) % HERO_PROMPTS.length);
          }
        });
      }, PAUSE_MS);
    });

    return () => {
      cancelled = true;
    };
  }, [prefersReducedMotion, promptIndex]);

  return (
    <section className="px-4 pb-14 pt-[78px] text-center sm:px-0">
      <p className="font-mono text-[11.5px] uppercase tracking-wide text-sage">
        A quiet place to check if you&apos;re okay
      </p>
      <h1 className="relative mx-auto mt-[18px] max-w-[680px] font-display text-[32px] font-medium leading-[1.18] tracking-tight text-foreground sm:text-[44px]">
        <span className="invisible block" aria-hidden="true">
          Is it normal to{" "}
          <span className="border-b-[3px] border-transparent pb-0.5">
            {sizingPrompt}
          </span>
          <span className="ml-0.5 inline-block w-[3px]" />
        </span>
        <span className="absolute inset-x-0 top-0">
          Is it normal to{" "}
          <span className="border-b-[3px] border-accent pb-0.5">
            {displayText}
          </span>
          <span
            className="ml-0.5 inline-block h-[1em] w-[3px] animate-pulse bg-sage-dark align-[-0.1em]"
            aria-hidden="true"
          />
        </span>
      </h1>
      <p
        className={`mx-auto mt-[22px] min-h-6 max-w-[480px] text-[15.5px] text-ink-secondary transition-opacity duration-500 ${
          displayReassurance ? "opacity-100" : "opacity-0"
        }`}
      >
        Yes, and here is the research on why.
      </p>
    </section>
  );
}
