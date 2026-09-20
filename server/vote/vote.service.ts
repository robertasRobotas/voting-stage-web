import { ForbiddenError, NotFoundError, ValidationError } from "../errors";
import type { VoteFields } from "../models/vote";
import { RATE_LIMITS, consume, hashIp } from "../rate-limit";
import * as votingRepo from "../voting/voting.repository";
import * as voteRepo from "./vote.repository";
import type { CastVoteInput } from "./vote.schemas";

export interface VoterIdentity {
  userId?: string;
  /** Verified email only — see RequestUser.verifiedEmail. */
  verifiedEmail?: string;
  displayName?: string;
  /** Only meaningful when there is no userId. */
  anonToken?: string;
  ip: string;
}

function validateAllocations(
  allocations: CastVoteInput["allocations"],
  knownItemIds: Set<string>,
): void {
  if (allocations.length === 0) {
    throw new ValidationError("At least one allocation is required");
  }
  const seenItems = new Set<string>();
  const seenPoints = new Set<number>();
  for (const a of allocations) {
    if (!knownItemIds.has(a.itemId)) {
      throw new ValidationError(`Unknown item: ${a.itemId}`);
    }
    if (seenItems.has(a.itemId)) {
      throw new ValidationError(`Duplicate allocation for item ${a.itemId}`);
    }
    if (seenPoints.has(a.points)) {
      throw new ValidationError(
        `Each Eurovision point value may only be used once (duplicate: ${a.points})`,
      );
    }
    seenItems.add(a.itemId);
    seenPoints.add(a.points);
  }
}

/**
 * Upsert a vote — first call creates, later calls replace the allocation in
 * place. A voter who returns to a board they've already voted on can change
 * their ballot any time before the board is finished.
 */
export async function castVote(
  votingIdOrShare: string,
  identity: VoterIdentity,
  input: CastVoteInput,
): Promise<{ vote: VoteFields; updated: boolean }> {
  const voting = await votingRepo.findByIdOrShareId(votingIdOrShare);
  if (!voting) throw new NotFoundError("Voting not found", "VOTING_NOT_FOUND");
  if (voting.status !== "OPEN") {
    throw new ForbiddenError("Voting is not open for voting", "VOTING_CLOSED");
  }

  if (voting.access !== "LINK" && !identity.userId) {
    throw new ForbiddenError("Sign in required to vote on this board", "AUTH_REQUIRED");
  }
  if (voting.access === "INVITE_ONLY") {
    if (!identity.verifiedEmail) {
      throw new ForbiddenError(
        "Your account's email address isn't verified, so it can't be matched to an invitation",
        "EMAIL_NOT_VERIFIED",
      );
    }
    if (!voting.invitedEmails.includes(identity.verifiedEmail)) {
      throw new ForbiddenError("Your email is not invited to this voting", "NOT_INVITED");
    }
  }

  const ballotIdentity = identity.userId
    ? { userId: identity.userId }
    : { anonToken: identity.anonToken };
  if (!ballotIdentity.userId && !ballotIdentity.anonToken) {
    throw new ValidationError("Anonymous voters must send an X-Anon-Token header");
  }

  // The anonymous token is chosen by the client, so it can't be the only rate
  // limit key — a script would just rotate it. Anonymous callers are limited
  // by IP as well.
  const boardKey = voting._id.toString();
  const ipKey = hashIp(identity.ip);
  await consume(
    `vote:${boardKey}:${identity.userId ?? `anon:${identity.anonToken}`}`,
    RATE_LIMITS.votePerIdentity,
  );
  if (!identity.userId) await consume(`vote-ip:${boardKey}:${ipKey}`, RATE_LIMITS.votePerIp);

  validateAllocations(input.allocations, new Set(voting.items.map((i) => i.id)));

  if (!identity.userId) {
    // Each fresh token is a brand-new ballot, so cap how many one network can
    // mint per board. Editing an existing ballot doesn't count against it.
    const existing = await voteRepo.findExisting(voting._id, ballotIdentity);
    if (!existing) {
      await consume(`new-ballot:${boardKey}:${ipKey}`, RATE_LIMITS.newAnonBallotsPerIp);
    }
  }

  return voteRepo.upsertBallot(voting._id, ballotIdentity, {
    allocations: input.allocations,
    // Signed-in voters are always shown under their account name.
    voterName: identity.displayName ?? input.voterName,
    voterEmail: identity.verifiedEmail,
  });
}

export async function getMyVote(
  votingIdOrShare: string,
  identity: { userId?: string; anonToken?: string },
): Promise<VoteFields | null> {
  const voting = await votingRepo.findByIdOrShareId(votingIdOrShare);
  if (!voting) return null;
  return voteRepo.findExisting(
    voting._id,
    identity.userId ? { userId: identity.userId } : { anonToken: identity.anonToken },
  );
}
