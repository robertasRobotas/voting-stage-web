import mongoose from "mongoose";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors";
import { shortId } from "../ids";
import type { IVoting } from "../models/voting";
import * as voteRepo from "../vote/vote.repository";
import * as votingRepo from "./voting.repository";
import type { CreateVotingInput, UpdateItemInput, UpdateSettingsInput } from "./voting.schemas";

const MIN_ITEMS = 2;

function normalizeEmails(emails: string[]): string[] {
  return [...new Set(emails.map((e) => e.toLowerCase()))];
}

function assertInviteListNotEmpty(access: IVoting["access"], invitedEmails: string[]): void {
  if (access === "INVITE_ONLY" && invitedEmails.length === 0) {
    throw new ValidationError("An invite-only board needs at least one invited email");
  }
}

export async function createVoting(
  ownerId: string,
  ownerEmail: string,
  input: CreateVotingInput,
): Promise<IVoting> {
  const invitedEmails = normalizeEmails(input.invitedEmails);
  assertInviteListNotEmpty(input.access, invitedEmails);
  return votingRepo.create({
    title: input.title,
    description: input.description,
    ownerId: new mongoose.Types.ObjectId(ownerId),
    ownerEmail: ownerEmail.toLowerCase(),
    status: "OPEN",
    access: input.access,
    invitedEmails,
    items: input.items.map((it, idx) => ({
      id: shortId(8),
      title: it.title,
      imageUrl: it.imageUrl,
      order: idx,
    })),
  });
}

export async function listMyVotings(ownerId: string): Promise<IVoting[]> {
  return votingRepo.listByOwner(ownerId);
}

export async function getByShareId(shareId: string): Promise<IVoting> {
  const v = await votingRepo.findByShareId(shareId);
  if (!v) throw new NotFoundError("Voting not found", "VOTING_NOT_FOUND");
  return v;
}

async function getOwned(id: string, userId: string): Promise<IVoting> {
  const v = await votingRepo.findByIdOrShareId(id);
  if (!v) throw new NotFoundError("Voting not found", "VOTING_NOT_FOUND");
  if (v.ownerId.toString() !== userId) {
    throw new ForbiddenError("Only the creator can perform this action", "NOT_OWNER");
  }
  return v;
}

/**
 * Once a board is finished its results are public. Changing the line-up after
 * that would silently rewrite them, so item edits require resuming first.
 */
function assertNotFinished(v: IVoting): void {
  if (v.status === "FINISHED") {
    throw new ValidationError("This voting is finished — resume it before changing its items");
  }
}

export async function finish(id: string, userId: string): Promise<IVoting> {
  const v = await getOwned(id, userId);
  v.status = "FINISHED";
  v.finishedAt = new Date();
  await v.save();
  return v;
}

export async function resume(id: string, userId: string): Promise<IVoting> {
  const v = await getOwned(id, userId);
  v.status = "OPEN";
  v.finishedAt = undefined;
  await v.save();
  return v;
}

export async function updateSettings(
  id: string,
  userId: string,
  input: UpdateSettingsInput,
): Promise<IVoting> {
  const v = await getOwned(id, userId);
  if (input.title !== undefined) v.title = input.title;
  // Empty string clears the description; absent leaves it unchanged.
  if (input.description !== undefined) v.description = input.description || undefined;
  if (input.access !== undefined) v.access = input.access;
  if (input.invitedEmails !== undefined) v.invitedEmails = normalizeEmails(input.invitedEmails);
  assertInviteListNotEmpty(v.access, v.invitedEmails);
  await v.save();
  return v;
}

export async function addItem(
  id: string,
  userId: string,
  input: { title: string; imageUrl?: string },
): Promise<IVoting> {
  const v = await getOwned(id, userId);
  assertNotFinished(v);
  v.items.push({
    id: shortId(8),
    title: input.title,
    imageUrl: input.imageUrl,
    order: v.items.length,
  });
  await v.save();
  return v;
}

export async function updateItem(
  id: string,
  userId: string,
  itemId: string,
  input: UpdateItemInput,
): Promise<IVoting> {
  const v = await getOwned(id, userId);
  assertNotFinished(v);
  const item = v.items.find((i) => i.id === itemId);
  if (!item) throw new NotFoundError("Item not found", "ITEM_NOT_FOUND");
  if (input.title !== undefined) item.title = input.title;
  // Empty string clears the image; `undefined` means "don't touch".
  if (input.imageUrl !== undefined) item.imageUrl = input.imageUrl || undefined;
  await v.save();
  return v;
}

export async function removeItem(id: string, userId: string, itemId: string): Promise<IVoting> {
  const v = await getOwned(id, userId);
  assertNotFinished(v);
  if (!v.items.some((i) => i.id === itemId)) {
    throw new NotFoundError("Item not found", "ITEM_NOT_FOUND");
  }
  if (v.items.length <= MIN_ITEMS) {
    throw new ValidationError(`A board needs at least ${MIN_ITEMS} items`);
  }
  v.items = v.items.filter((i) => i.id !== itemId);
  v.items.forEach((i, idx) => (i.order = idx));
  await v.save();
  return v;
}

export async function reorderItems(
  id: string,
  userId: string,
  itemIds: string[],
): Promise<IVoting> {
  const v = await getOwned(id, userId);
  const known = new Set(v.items.map((i) => i.id));
  const unique = new Set(itemIds);
  if (unique.size !== known.size || itemIds.length !== known.size || !itemIds.every((i) => known.has(i))) {
    throw new ValidationError("itemIds must contain every existing item exactly once");
  }
  const byId = new Map(v.items.map((i) => [i.id, i] as const));
  v.items = itemIds.map((itemId, idx) => {
    const item = byId.get(itemId)!;
    item.order = idx;
    return item;
  });
  await v.save();
  return v;
}

/**
 * Drops the board and every vote that was cast on it. We don't soft-delete:
 * a board with leaked share link can stay reachable forever, so a hard delete
 * is the safer default.
 *
 * Votes go first on purpose. Without a transaction (not available on a
 * standalone dev MongoDB) one of the two deletes can fail alone: this order
 * leaves a board the owner can simply delete again, whereas the reverse would
 * strand ballots nobody can reach.
 */
export async function deleteVoting(id: string, userId: string): Promise<void> {
  const v = await getOwned(id, userId);
  await voteRepo.deleteByVoting(v._id);
  await votingRepo.deleteById(v._id);
}
