"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { resolveSwipeAction, type SwipeAction } from "@/lib/deck/gesture";

type SwipeDeckProps<T> = {
  item: T | null;
  onAction: (action: SwipeAction) => void;
  onTapAdvance: () => void;
  renderCard: (item: T) => ReactNode;
  emptyState: ReactNode;
  reducedMotionFallback?: ReactNode;
};

export function SwipeDeck<T>({
  item,
  onAction,
  onTapAdvance,
  renderCard,
  emptyState,
  reducedMotionFallback,
}: SwipeDeckProps<T>) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const resetDrag = useCallback(() => {
    setOffsetX(0);
    setIsDragging(false);
    pointerIdRef.current = null;
  }, []);

  const commitAction = useCallback(
    (action: SwipeAction) => {
      resetDrag();
      onAction(action);
    },
    [onAction, resetDrag],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!item || prefersReducedMotion) {
        return;
      }
      pointerIdRef.current = event.pointerId;
      startXRef.current = event.clientX;
      startTimeRef.current = performance.now();
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [item, prefersReducedMotion],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || pointerIdRef.current !== event.pointerId) {
        return;
      }
      setOffsetX(event.clientX - startXRef.current);
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || pointerIdRef.current !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - startXRef.current;
      const elapsedMs = Math.max(performance.now() - startTimeRef.current, 1);
      const velocityX = deltaX / elapsedMs;
      const action = resolveSwipeAction(deltaX, velocityX);
      if (action) {
        commitAction(action);
        return;
      }
      resetDrag();
    },
    [commitAction, isDragging, resetDrag],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!item) {
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        commitAction("skip");
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        commitAction("save");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commitAction, item]);

  if (!item) {
    return <>{emptyState}</>;
  }

  if (prefersReducedMotion && reducedMotionFallback) {
    return <>{reducedMotionFallback}</>;
  }

  const rotation = offsetX * 0.04;
  const saveOpacity = Math.min(Math.max(offsetX / 120, 0), 1);
  const skipOpacity = Math.min(Math.max(-offsetX / 120, 0), 1);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div
        className="relative touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={resetDrag}
      >
        <div
          className={`relative rounded-3xl border border-border bg-surface p-6 shadow-lg transition-transform ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          style={{
            transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
          }}
          onClick={() => {
            if (!isDragging && Math.abs(offsetX) < 6) {
              onTapAdvance();
            }
          }}
        >
          <span
            className="pointer-events-none absolute left-6 top-6 rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sage-dark"
            style={{ opacity: saveOpacity }}
          >
            Save
          </span>
          <span
            className="pointer-events-none absolute right-6 top-6 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-warning-text"
            style={{ opacity: skipOpacity }}
          >
            Skip
          </span>
          {renderCard(item)}
        </div>
      </div>
    </div>
  );
}
