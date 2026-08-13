import { describe, expect, it } from "vitest";

import { favoriteKey, parseFavoriteKey } from "./keys";

describe("favoriteKey", () => {
  it("builds a stable content key", () => {
    expect(favoriteKey("card", "abc-123")).toBe("card:abc-123");
  });
});

describe("parseFavoriteKey", () => {
  it("parses valid keys", () => {
    expect(parseFavoriteKey("card:abc-123")).toEqual({
      contentType: "card",
      contentId: "abc-123",
    });
  });

  it("rejects invalid keys", () => {
    expect(parseFavoriteKey("invalid")).toBeNull();
    expect(parseFavoriteKey("unknown:abc")).toBeNull();
  });
});
