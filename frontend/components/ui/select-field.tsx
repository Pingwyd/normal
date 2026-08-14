"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectFieldProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "form" | "compact";
  "aria-label"?: string;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  disabled = false,
  className = "",
  variant = "form",
  "aria-label": ariaLabel,
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const listboxId = `${fieldId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const enabledOptions = useMemo(
    () => options.filter((option) => !option.disabled),
    [options],
  );

  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;
  const hasValue = Boolean(selectedOption);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function openList() {
    if (disabled) {
      return;
    }
    const selectedIndex = enabledOptions.findIndex(
      (option) => option.value === value,
    );
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setIsOpen(true);
  }

  function selectOption(option: SelectOption) {
    if (option.disabled) {
      return;
    }
    onChange(option.value);
    setIsOpen(false);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openList();
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (!isOpen || enabledOptions.length === 0) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((current) =>
        current >= enabledOptions.length - 1 ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) =>
        current <= 0 ? enabledOptions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = enabledOptions[highlightIndex];
      if (option) {
        selectOption(option);
      }
    }
  }

  const triggerPadding = variant === "compact" ? "px-3 py-2" : "px-3 py-2.5";

  return (
    <div className={`relative ${className}`.trim()} ref={rootRef}>
      {label ? (
        <label htmlFor={fieldId} className="mb-1 block text-sm font-medium">
          {label}
          {required ? " *" : ""}
        </label>
      ) : null}

      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel ?? label}
        onClick={() => (isOpen ? setIsOpen(false) : openList())}
        onKeyDown={handleTriggerKeyDown}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border border-border-strong bg-surface text-left text-sm transition-colors hover:border-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark disabled:cursor-not-allowed disabled:opacity-60 ${triggerPadding} ${
          hasValue ? "text-foreground" : "text-muted"
        }`}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-sage transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={label ? fieldId : undefined}
          aria-label={!label ? ariaLabel : undefined}
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-[0_10px_24px_rgba(32,43,38,0.08)]"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            const enabledIndex = enabledOptions.findIndex(
              (item) => item.value === option.value,
            );
            const isHighlighted = enabledIndex === highlightIndex;

            return (
              <li
                key={option.value || "__empty__"}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm ${
                  option.disabled
                    ? "cursor-not-allowed text-muted"
                    : isSelected
                      ? "bg-sage-dark text-white"
                      : isHighlighted
                        ? "bg-surface-muted text-foreground"
                        : "text-foreground hover:bg-surface-muted"
                }`}
                onMouseEnter={() => {
                  if (!option.disabled && enabledIndex >= 0) {
                    setHighlightIndex(enabledIndex);
                  }
                }}
                onClick={() => selectOption(option)}
              >
                <span className="min-w-0 flex-1">{option.label}</span>
                {isSelected ? (
                  <Check size={14} aria-hidden="true" className="shrink-0" />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
