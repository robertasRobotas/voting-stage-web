import { describe, expect, it } from "vitest";
import { buildTierList, tierFor } from "./tiers";

describe("tierFor", () => {
  it("ranks by share of the leader's points", () => {
    expect(tierFor(100, 100)).toBe("S");
    expect(tierFor(80, 100)).toBe("S");
    expect(tierFor(79, 100)).toBe("A");
    expect(tierFor(40, 100)).toBe("B");
    expect(tierFor(20, 100)).toBe("C");
    expect(tierFor(19, 100)).toBe("D");
  });

  it("puts pointless items and empty boards in D", () => {
    expect(tierFor(0, 100)).toBe("D");
    expect(tierFor(0, 0)).toBe("D");
  });
});

describe("buildTierList", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "unvoted" }];
  const perItem = [
    { itemId: "b", totalPoints: 30 },
    { itemId: "a", totalPoints: 36 },
    { itemId: "c", totalPoints: 10 },
  ];

  it("groups items into tiers, best first, including items with no votes", () => {
    const tiers = buildTierList(items, perItem);
    expect(tiers.map((t) => [t.tier, t.items.map((i) => i.id)])).toEqual([
      ["S", ["a", "b"]],
      ["A", []],
      ["B", []],
      ["C", ["c"]],
      ["D", ["unvoted"]],
    ]);
  });

  it("handles a board with no votes at all", () => {
    const tiers = buildTierList(items, []);
    expect(tiers.find((t) => t.tier === "D")?.items).toHaveLength(4);
  });
});
