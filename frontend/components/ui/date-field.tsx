"use client";

import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export type DateFieldProps = {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: "form" | "compact";
  placeholder?: string;
  "aria-label"?: string;
};

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string, placeholder: string): string {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return placeholder;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function buildCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  for (let index = 0; index < startOffset; index += 1) {
    const date = new Date(year, month, index - startOffset + 1);
    cells.push({ date, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const last =
      cells[cells.length - 1]?.date ?? new Date(year, month, daysInMonth);
    const next = new Date(last);
    next.setDate(last.getDate() + 1);
    cells.push({ date: next, inMonth: false });
  }

  return cells;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DateField({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  className = "",
  variant = "form",
  placeholder = "Select date",
  "aria-label": ariaLabel,
}: DateFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const panelId = `${fieldId}-calendar`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = parseIsoDate(value);
  const [viewDate, setViewDate] = useState<Date>(
    () => selectedDate ?? new Date(),
  );

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);
  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(viewDate);

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

  function openCalendar() {
    if (disabled) {
      return;
    }
    setViewDate(selectedDate ?? new Date());
    setIsOpen(true);
  }

  function selectDate(date: Date) {
    onChange(toIsoDate(date));
    setIsOpen(false);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "ArrowDown"
    ) {
      event.preventDefault();
      openCalendar();
    }
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const triggerPadding = variant === "compact" ? "px-3 py-2" : "px-3 py-2.5";
  const todayIso = toIsoDate(new Date());

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
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={ariaLabel ?? label}
        onClick={() => (isOpen ? setIsOpen(false) : openCalendar())}
        onKeyDown={handleTriggerKeyDown}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border border-border-strong bg-surface text-left text-sm transition-colors hover:border-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-dark disabled:cursor-not-allowed disabled:opacity-60 ${triggerPadding} ${
          selectedDate ? "text-foreground" : "text-muted"
        }`}
      >
        <span className="inline-flex min-w-0 items-center gap-2 truncate">
          <Calendar
            size={16}
            aria-hidden="true"
            className="shrink-0 text-sage"
          />
          {formatDisplayDate(value, placeholder)}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-sage transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={label ? `${label} calendar` : "Date calendar"}
          className="absolute z-50 mt-1 w-[min(100%,18rem)] rounded-xl border border-border bg-surface p-3 shadow-[0_10px_24px_rgba(32,43,38,0.08)]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() =>
                setViewDate(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
              className="inline-flex size-8 items-center justify-center rounded-md border border-border-strong text-sage-dark hover:border-sage"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <p className="font-medium text-sm text-foreground">{monthLabel}</p>
            <button
              type="button"
              aria-label="Next month"
              onClick={() =>
                setViewDate(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
              className="inline-flex size-8 items-center justify-center rounded-md border border-border-strong text-sage-dark hover:border-sage"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_LABELS.map((weekday) => (
              <span
                key={weekday}
                className="py-1 text-[10.5px] font-medium uppercase tracking-wide text-muted"
              >
                {weekday}
              </span>
            ))}
            {calendarDays.map(({ date, inMonth }) => {
              const iso = toIsoDate(date);
              const isSelected = value === iso;
              const isToday = todayIso === iso;

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => selectDate(date)}
                  className={`size-8 rounded-md text-sm ${
                    !inMonth
                      ? "cursor-default text-muted/40"
                      : isSelected
                        ? "bg-sage-dark text-white"
                        : isToday
                          ? "border border-sage text-sage-dark hover:bg-surface-muted"
                          : "text-foreground hover:bg-surface-muted"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-sage-dark hover:bg-surface-muted"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
