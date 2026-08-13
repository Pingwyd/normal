import { describe, expect, it } from "vitest";

import { resolveSwipeAction } from "./gesture";

describe("resolveSwipeAction", () => {
  it("returns save for a strong right swipe", () => {
    expect(resolveSwipeAction(120, 0)).toBe("save");
  });

  it("returns skip for a strong left swipe", () => {
    expect(resolveSwipeAction(-120, 0)).toBe("skip");
  });

  it("returns save for a fast right flick", () => {
    expect(resolveSwipeAction(40, 0.6)).toBe("save");
  });

  it("returns skip for a fast left flick", () => {
    expect(resolveSwipeAction(-40, -0.6)).toBe("skip");
  });

  it("returns null for small movement", () => {
    expect(resolveSwipeAction(20, 0.1)).toBeNull();
  });
});
