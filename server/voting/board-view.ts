import type { RequestUser } from "../auth";
import type { IVoting } from "../models/voting";
import * as voteRepo from "../vote/vote.repository";
import { computeResults, isEligibleVote, toVoterRecords } from "../vote/results";
import * as votingService from "./voting.service";

function isOwner(v: IVoting, userId?: string): boolean {
  return !!userId && v.ownerId.toString() === userId;
}

/** Board fields safe for the given viewer. Owner-only fields are dropped for everyone else. */
export function toVotingDto(v: IVoting, viewerUserId?: string) {
  const owner = isOwner(v, viewerUserId);
  return {
    id: v._id.toString(),
    shareId: v.shareId,
    title: v.title,
    description: v.description,
    status: v.status,
    access: v.access,
    isOwner: owner,
    ownerEmail: owner ? v.ownerEmail : undefined,
    invitedEmails: owner ? v.invitedEmails : undefined,
    items: v.items
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((i) => ({ id: i.id, title: i.title, imageUrl: i.imageUrl })),
    finishedAt: v.finishedAt,
    createdAt: v.createdAt,
  };
}

export function canViewerVote(v: IVoting, viewer?: RequestUser): boolean {
  if (v.status !== "OPEN") return false;
  switch (v.access) {
    case "INVITE_ONLY":
      return !!viewer?.verifiedEmail && v.invitedEmails.includes(viewer.verifiedEmail);
    case "SIGNED_IN":
      return !!viewer;
    default:
      return true;
  }
}

/**
 * Everything the share page needs in one payload. The owner always sees live
 * results and the voter list; everyone else only once the board is finished —
 * and never with email addresses.
 */
export async function getBoardView(shareId: string, viewer?: RequestUser) {
  const v = await votingService.getByShareId(shareId);
  const owner = isOwner(v, viewer?.userId);
  const dto = { ...toVotingDto(v, viewer?.userId), canVote: canViewerVote(v, viewer) };

  if (!owner && v.status !== "FINISHED") return dto;

  // One query feeds both the tally and the voter list.
  const allVotes = await voteRepo.listByVoting(v._id);
  const votes = allVotes.filter((vote) => isEligibleVote(v, vote));
  const knownItemIds = new Set(v.items.map((i) => i.id));

  return {
    ...dto,
    results: {
      ...computeResults(votes, knownItemIds),
      // Ballots left out because access was tightened after they were cast.
      ineligibleVotes: owner ? allVotes.length - votes.length : undefined,
    },
    voters: toVoterRecords(votes, knownItemIds, { includeEmails: owner }),
  };
}
