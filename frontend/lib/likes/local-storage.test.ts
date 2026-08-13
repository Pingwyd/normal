import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  LOCAL_LIKES_STORAGE_KEY,
  readLocalLike,
  writeLocalLike,
} from "./local-storage";

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
  vi.unstubAllGlobals();
});

describe("local like storage", () => {
  it("stores and reads liked card ids", () => {
    writeLocalLike("card-a", true);
    expect(readLocalLike("card-a")).toBe(true);
    expect(readLocalLike("card-b")).toBe(false);
  });

  it("removes a card id when unliked", () => {
    writeLocalLike("card-a", true);
    writeLocalLike("card-a", false);
    expect(readLocalLike("card-a")).toBe(false);
    const stored = window.localStorage.getItem(LOCAL_LIKES_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored ?? "{}").card_ids).toEqual([]);
  });
});
