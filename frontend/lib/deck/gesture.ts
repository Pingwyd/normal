export const SWIPE_COMMIT_PX = 88;
export const SWIPE_VELOCITY_PX_MS = 0.45;

export type SwipeAction = "skip" | "save";

export function resolveSwipeAction(
  deltaX: number,
  velocityX: number,
): SwipeAction | null {
  if (
    deltaX <= -SWIPE_COMMIT_PX ||
    (deltaX < 0 && velocityX <= -SWIPE_VELOCITY_PX_MS)
  ) {
    return "skip";
  }

  if (
    deltaX >= SWIPE_COMMIT_PX ||
    (deltaX > 0 && velocityX >= SWIPE_VELOCITY_PX_MS)
  ) {
    return "save";
  }

  return null;
}
