import type { VoterRecord, VotingAccess, VotingResults } from "@/lib/types";
import type { VoteFields } from "../models/vote";

/**
 * Does this ballot still count under the board's CURRENT access rules?
 *
 * Access can be tightened after votes are in (link → invite-only, or an email
 * removed from the list). Rather than deleting those ballots — which the owner
 * couldn't undo — they're simply left out of results. Loosen the rules again
 * (or re-add the email) and they count again.
 */
export function isEligibleVote(
  board: { access: VotingAccess; invitedEmails: string[] },
  vote: Pick<VoteFields, "userId" | "voterEmail">,
): boolean {
  switch (board.access) {
    case "INVITE_ONLY":
      return !!vote.voterEmail && board.invitedEmails.includes(vote.voterEmail.toLowerCase());
    case "SIGNED_IN":
      return !!vote.userId;
    default:
      return true;
  }
}

/**
 * Tally points per item. Allocations that point at items the owner has since
 * removed are dropped, so clients never see orphaned item ids.
 */
export function computeResults(votes: VoteFields[], knownItemIds: Set<string>): VotingResults {
  const perItem = new Map<
    string,
    { totalPoints: number; voteCount: number; breakdown: Record<string, number> }
  >();

  for (const v of votes) {
    for (const a of v.allocations) {
      if (!knownItemIds.has(a.itemId)) continue;
      const entry = perItem.get(a.itemId) ?? { totalPoints: 0, voteCount: 0, breakdown: {} };
      entry.totalPoints += a.points;
      entry.voteCount += 1;
      const key = a.points.toString();
      entry.breakdown[key] = (entry.breakdown[key] ?? 0) + 1;
      perItem.set(a.itemId, entry);
    }
  }

  return {
    totalVotes: votes.length,
    perItem: Array.from(perItem.entries())
      .map(([itemId, e]) => ({
        itemId,
        totalPoints: e.totalPoints,
        voteCount: e.voteCount,
        pointsBreakdown: e.breakdown,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints),
  };
}

/** Per-voter ballots, oldest first. Emails are included for the owner only. */
export function toVoterRecords(
  votes: VoteFields[],
  knownItemIds: Set<string>,
  opts: { includeEmails: boolean },
): Array<Omit<VoterRecord, "castAt"> & { castAt: Date }> {
  return votes
    .map((v) => ({
      voteId: v._id.toString(),
      voterName: v.voterName,
      voterEmail: opts.includeEmails ? v.voterEmail : undefined,
      isSignedIn: !!v.userId,
      isAnonymous: !v.userId,
      allocations: v.allocations
        .filter((a) => knownItemIds.has(a.itemId))
        .map((a) => ({ itemId: a.itemId, points: a.points })),
      castAt: v.createdAt,
    }))
    .sort((a, b) => a.castAt.getTime() - b.castAt.getTime());
}
