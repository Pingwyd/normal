import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ANONYMOUS_FAVORITES_STORAGE_KEY,
  clearAnonymousFavorites,
  readAnonymousFavorites,
  writeAnonymousFavorites,
} from "./local-storage";

const sampleItem = {
  content_type: "card" as const,
  content_id: "11111111-1111-1111-1111-111111111111",
};

class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: new MemoryStorage() });
});

afterEach(() => {
  clearAnonymousFavorites();
  vi.unstubAllGlobals();
});

describe("readAnonymousFavorites", () => {
  it("returns an empty list when storage is empty", () => {
    expect(readAnonymousFavorites()).toEqual([]);
  });

  it("persists favorites across reads", () => {
    writeAnonymousFavorites([sampleItem]);
    expect(readAnonymousFavorites()).toEqual([sampleItem]);
  });

  it("dedupes duplicate entries", () => {
    writeAnonymousFavorites([sampleItem, sampleItem]);
    expect(readAnonymousFavorites()).toEqual([sampleItem]);
  });
});

describe("clearAnonymousFavorites", () => {
  it("removes stored favorites", () => {
    writeAnonymousFavorites([sampleItem]);
    clearAnonymousFavorites();
    expect(
      window.localStorage.getItem(ANONYMOUS_FAVORITES_STORAGE_KEY),
    ).toBeNull();
  });
});
