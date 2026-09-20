import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/v/abc123/admin")).toBe("/v/abc123/admin");
    expect(safeNextPath("/votings/new?x=1")).toBe("/votings/new?x=1");
  });

  it("falls back for anything that could leave the site", () => {
    for (const bad of [
      null,
      "",
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "dashboard",
    ]) {
      expect(safeNextPath(bad)).toBe("/dashboard");
    }
  });
});
