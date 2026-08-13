export type LikeSnapshot = {
  liked: boolean;
  likeCount: number;
};

export function nextLikeTarget(currentTarget: boolean): boolean {
  return !currentTarget;
}

export function shouldSyncLike(
  targetLiked: boolean,
  serverLiked: boolean,
): boolean {
  return targetLiked !== serverLiked;
}

export function visibleLikeState(
  targetLiked: boolean,
  snapshot: LikeSnapshot,
): LikeSnapshot {
  return {
    liked: targetLiked,
    likeCount: snapshot.likeCount,
  };
}
