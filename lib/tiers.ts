export const TIERS = ["S", "A", "B", "C", "D"] as const;
export type Tier = (typeof TIERS)[number];

/** Classic tier-list colours. Text on them is always dark. */
export const TIER_COLORS: Record<Tier, string> = {
  S: "#ff7f7f",
  A: "#ffbf7f",
  B: "#ffdf7f",
  C: "#ffff7f",
  D: "#bfff7f",
};

/**
 * Tier by share of the leader's points: S is within 20% of the winner, D is
 * under 20% (including items nobody gave points to). Relative rather than
 * absolute, so it works the same for 3 voters or 300.
 */
export function tierFor(points: number, maxPoints: number): Tier {
  if (maxPoints <= 0 || points <= 0) return "D";
  const ratio = points / maxPoints;
  if (ratio >= 0.8) return "S";
  if (ratio >= 0.6) return "A";
  if (ratio >= 0.4) return "B";
  if (ratio >= 0.2) return "C";
  return "D";
}

/** Group a board's items into tiers, best first within each tier. Empty tiers are kept. */
export function buildTierList<T extends { id: string }>(
  items: T[],
  perItem: Array<{ itemId: string; totalPoints: number }>,
): Array<{ tier: Tier; items: Array<T & { totalPoints: number }> }> {
  const pointsById = new Map(perItem.map((r) => [r.itemId, r.totalPoints]));
  const maxPoints = Math.max(0, ...perItem.map((r) => r.totalPoints));
  const scored = items
    .map((item) => ({ ...item, totalPoints: pointsById.get(item.id) ?? 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
  return TIERS.map((tier) => ({
    tier,
    items: scored.filter((item) => tierFor(item.totalPoints, maxPoints) === tier),
  }));
}
