import { afterEach, describe, expect, it, vi } from "vitest";
import { gtag, track } from "./analytics";

afterEach(() => vi.unstubAllGlobals());

describe("gtag", () => {
  it("queues calls as `arguments` objects, which is the only shape gtag.js accepts", () => {
    const win: { dataLayer?: unknown[] } = {};
    vi.stubGlobal("window", win);
    gtag("event", "vote_cast", { is_update: false });
    expect(win.dataLayer).toHaveLength(1);
    const entry = win.dataLayer![0];
    expect(Array.isArray(entry)).toBe(false);
    expect(Array.from(entry as ArrayLike<unknown>)).toEqual([
      "event",
      "vote_cast",
      { is_update: false },
    ]);
  });

  it("does nothing on the server", () => {
    expect(() => gtag("event", "x")).not.toThrow();
  });
});

describe("track", () => {
  it("sends nothing outside production", () => {
    const win: { dataLayer?: unknown[] } = {};
    vi.stubGlobal("window", win);
    track("board_resumed", {});
    expect(win.dataLayer).toBeUndefined();
  });
});
