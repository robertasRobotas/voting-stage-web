import mongoose from "mongoose";
import { isDuplicateKeyError } from "../errors";
import { VoteModel, type IVoteAllocation, type VoteFields } from "../models/vote";

/** Exactly one of these identifies a ballot: signed-in user, or anonymous token. */
export interface BallotIdentity {
  userId?: string;
  anonToken?: string;
}

function ballotFilter(votingId: mongoose.Types.ObjectId, identity: BallotIdentity) {
  if (identity.userId) {
    return { votingId, userId: new mongoose.Types.ObjectId(identity.userId) };
  }
  if (identity.anonToken) return { votingId, anonToken: identity.anonToken };
  return null;
}

export async function findExisting(
  votingId: mongoose.Types.ObjectId,
  identity: BallotIdentity,
): Promise<VoteFields | null> {
  const filter = ballotFilter(votingId, identity);
  if (!filter) return null;
  return VoteModel.findOne(filter).lean<VoteFields>();
}

export interface BallotFields {
  allocations: IVoteAllocation[];
  voterName?: string;
  voterEmail?: string;
}

/**
 * Create-or-replace a ballot in one atomic upsert. The identity fields come
 * from the filter, so an insert stores them automatically. Two concurrent
 * first submits can still collide on the unique index — the loser retries and
 * becomes a plain update.
 */
export async function upsertBallot(
  votingId: mongoose.Types.ObjectId,
  identity: BallotIdentity,
  fields: BallotFields,
): Promise<{ vote: VoteFields; updated: boolean }> {
  const filter = ballotFilter(votingId, identity);
  if (!filter) throw new Error("upsertBallot needs a userId or an anonToken");

  const set: Partial<BallotFields> = { allocations: fields.allocations };
  if (fields.voterName !== undefined) set.voterName = fields.voterName;
  if (fields.voterEmail !== undefined) set.voterEmail = fields.voterEmail;

  const run = () =>
    VoteModel.findOneAndUpdate(
      filter,
      { $set: set },
      { upsert: true, new: true, lean: true, includeResultMetadata: true },
    );

  let result;
  try {
    result = await run();
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    result = await run();
  }
  if (!result.value) throw new Error("Ballot upsert returned nothing");
  return {
    vote: result.value as unknown as VoteFields,
    updated: result.lastErrorObject?.updatedExisting === true,
  };
}

export async function listByVoting(votingId: mongoose.Types.ObjectId): Promise<VoteFields[]> {
  return VoteModel.find({ votingId }).lean<VoteFields[]>();
}

export async function deleteByVoting(votingId: mongoose.Types.ObjectId): Promise<void> {
  await VoteModel.deleteMany({ votingId });
}
