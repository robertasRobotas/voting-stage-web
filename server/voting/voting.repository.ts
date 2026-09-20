import mongoose from "mongoose";
import { VotingModel, type IVoting } from "../models/voting";

export async function create(data: Partial<IVoting>): Promise<IVoting> {
  return VotingModel.create(data);
}

export async function findByShareId(shareId: string): Promise<IVoting | null> {
  return VotingModel.findOne({ shareId });
}

/** Accepts either a Mongo `_id` or a `shareId` — the same handlers serve both
 *  the share-link route and the owner's dashboard, and callers don't always
 *  know which one they hold. */
export async function findByIdOrShareId(idOrShare: string): Promise<IVoting | null> {
  if (/^[0-9a-f]{24}$/i.test(idOrShare)) {
    const byId = await VotingModel.findById(idOrShare);
    if (byId) return byId;
  }
  return VotingModel.findOne({ shareId: idOrShare });
}

export async function listByOwner(ownerId: string): Promise<IVoting[]> {
  return VotingModel.find({ ownerId: new mongoose.Types.ObjectId(ownerId) }).sort({
    createdAt: -1,
  });
}

export async function deleteById(id: mongoose.Types.ObjectId): Promise<void> {
  await VotingModel.deleteOne({ _id: id });
}
