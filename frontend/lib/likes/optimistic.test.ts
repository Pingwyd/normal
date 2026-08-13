import { describe, expect, it } from "vitest";

import { nextLikeTarget, shouldSyncLike, visibleLikeState } from "./optimistic";

describe("nextLikeTarget", () => {
  it("flips the desired liked state on each click", () => {
    expect(nextLikeTarget(false)).toBe(true);
    expect(nextLikeTarget(true)).toBe(false);
  });
});

describe("shouldSyncLike", () => {
  it("requires sync only when target and server disagree", () => {
    expect(shouldSyncLike(true, false)).toBe(true);
    expect(shouldSyncLike(false, true)).toBe(true);
    expect(shouldSyncLike(true, true)).toBe(false);
    expect(shouldSyncLike(false, false)).toBe(false);
  });
});

describe("visibleLikeState", () => {
  it("shows the target liked state while keeping the server count", () => {
    expect(visibleLikeState(true, { liked: false, likeCount: 3 })).toEqual({
      liked: true,
      likeCount: 3,
    });
  });
});
