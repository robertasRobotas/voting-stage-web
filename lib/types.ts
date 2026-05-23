export const EUROVISION_POINTS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12] as const;
export type EurovisionPoint = (typeof EUROVISION_POINTS)[number];

export type VotingStatus = "DRAFT" | "OPEN" | "FINISHED";
export type VotingAccess = "INVITE_ONLY" | "LINK";

export interface VotingItem {
  id: string;
  title: string;
  imageUrl?: string;
}

export interface VotingDto {
  id: string;
  shareId: string;
  title: string;
  description?: string;
  status: VotingStatus;
  access: VotingAccess;
  isOwner: boolean;
  ownerEmail?: string;
  invitedEmails?: string[];
  items: VotingItem[];
  finishedAt?: string;
  createdAt: string;
  canVote?: boolean;
  results?: VotingResults;
  /** Owner-only / finished-voting only: who voted and what they assigned. */
  voters?: VoterRecord[];
}

export interface VotingResults {
  totalVotes: number;
  perItem: Array<{
    itemId: string;
    totalPoints: number;
    voteCount: number;
    pointsBreakdown: Record<string, number>;
  }>;
}

export interface VoterRecord {
  voteId: string;
  voterName?: string;
  voterEmail?: string;
  isSignedIn: boolean;
  isAnonymous: boolean;
  allocations: Array<{ itemId: string; points: number }>;
  castAt: string;
}

export interface MyVoteResponse {
  voted: boolean;
  allocations: Array<{ itemId: string; points: EurovisionPoint }>;
  voterName?: string;
  castAt?: string;
  updatedAt?: string;
}
