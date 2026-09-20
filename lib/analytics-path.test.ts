import { describe, expect, it } from "vitest";
import { isBoardPath, redactPath, redactSearch } from "./analytics-path";

describe("redactPath", () => {
  it("hides board share ids, keeps the page type", () => {
    expect(redactPath("/v/aB3_x-9KqZ")).toBe("/v/[board]");
    expect(redactPath("/v/aB3_x-9KqZ/admin")).toBe("/v/[board]/admin");
    expect(isBoardPath("/v/aB3_x-9KqZ")).toBe(true);
  });

  it("leaves public pages alone", () => {
    for (const p of ["/", "/ideas/movie-night", "/guides", "/votings/new"]) {
      expect(redactPath(p)).toBe(p);
      expect(isBoardPath(p)).toBe(false);
    }
  });
});

describe("redactSearch", () => {
  it("keeps campaign tags only", () => {
    expect(redactSearch("?utm_source=reddit&utm_campaign=launch&created=1")).toBe(
      "?utm_source=reddit&utm_campaign=launch",
    );
  });

  it("drops a login redirect that points at a board", () => {
    expect(redactSearch("?next=/v/aB3_x-9KqZ")).toBe("");
    expect(redactSearch("")).toBe("");
  });
});
