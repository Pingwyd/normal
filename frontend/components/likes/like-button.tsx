"use client";

import { ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { fetchCardLikeStatus, toggleCardLike } from "@/lib/likes/client-api";
import { getOrCreateDeviceId } from "@/lib/likes/device-id";
import { readLocalLike, writeLocalLike } from "@/lib/likes/local-storage";
import {
  nextLikeTarget,
  shouldSyncLike,
  visibleLikeState,
  type LikeSnapshot,
} from "@/lib/likes/optimistic";

type LikeButtonProps = {
  cardId: string;
  initialLikeCount: number;
  label?: string;
  className?: string;
};

export function LikeButton({
  cardId,
  initialLikeCount,
  label = "this card",
  className = "",
}: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const serverSnapshotRef = useRef<LikeSnapshot>({
    liked: false,
    likeCount: initialLikeCount,
  });
  const targetLikedRef = useRef(false);
  const inFlightRef = useRef(false);

  const applyVisibleState = useCallback(() => {
    const visible = visibleLikeState(
      targetLikedRef.current,
      serverSnapshotRef.current,
    );
    setLiked(visible.liked);
    setLikeCount(visible.likeCount);
  }, []);

  const syncFromServer = useCallback(
    (likedValue: boolean, count: number) => {
      serverSnapshotRef.current = { liked: likedValue, likeCount: count };
      targetLikedRef.current = likedValue;
      writeLocalLike(cardId, likedValue);
      applyVisibleState();
    },
    [applyVisibleState, cardId],
  );

  const syncToTarget = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    while (
      shouldSyncLike(targetLikedRef.current, serverSnapshotRef.current.liked)
    ) {
      inFlightRef.current = true;

      try {
        const result = await toggleCardLike(cardId);
        serverSnapshotRef.current = {
          liked: result.liked,
          likeCount: result.like_count,
        };
        writeLocalLike(cardId, result.liked);
        setErrorMessage(null);
        applyVisibleState();
      } catch (error) {
        targetLikedRef.current = serverSnapshotRef.current.liked;
        applyVisibleState();
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not update like state.",
        );
        break;
      } finally {
        inFlightRef.current = false;
      }
    }
  }, [applyVisibleState, cardId]);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      getOrCreateDeviceId();
      const localLiked = readLocalLike(cardId);

      try {
        const status = await fetchCardLikeStatus(cardId);
        if (cancelled) {
          return;
        }
        syncFromServer(status.liked, status.like_count);
      } catch {
        if (cancelled) {
          return;
        }
        serverSnapshotRef.current = {
          liked: localLiked,
          likeCount: initialLikeCount,
        };
        targetLikedRef.current = localLiked;
        applyVisibleState();
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [applyVisibleState, cardId, initialLikeCount, syncFromServer]);

  function handleClick() {
    if (!isReady) {
      return;
    }

    setErrorMessage(null);
    targetLikedRef.current = nextLikeTarget(targetLikedRef.current);
    applyVisibleState();
    void syncToTarget();
  }

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={!isReady}
        aria-pressed={liked}
        aria-label={liked ? `Unlike ${label}` : `Mark ${label} as useful`}
        className="inline-flex items-center gap-1 rounded-full border border-transparent px-2 py-1 text-sage-dark transition-colors hover:border-border hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ThumbsUp
          size={14}
          aria-hidden="true"
          className={liked ? "fill-current text-sage-dark" : "text-muted"}
        />
        <span className="text-xs font-medium">
          {likeCount} found this useful
        </span>
      </button>
      {errorMessage ? (
        <span className="text-xs text-warning-text" role="status">
          {errorMessage}
        </span>
      ) : null}
    </span>
  );
}
