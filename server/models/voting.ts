import mongoose, { type Document, type Model } from "mongoose";
import type { VotingAccess, VotingStatus } from "@/lib/types";
import { shortId } from "../ids";

export const VOTING_STATUSES = ["DRAFT", "OPEN", "FINISHED"] as const satisfies readonly VotingStatus[];

/**
 * Who is allowed to cast a vote on a board.
 * - LINK: anyone with the link (anonymous voters get a localStorage token).
 * - SIGNED_IN: anyone with the link, but they must sign in — one ballot per
 *   account, which is what actually stops ballot stuffing.
 * - INVITE_ONLY: only the listed (verified) emails, signed in.
 */
export const VOTING_ACCESSES = ["LINK", "SIGNED_IN", "INVITE_ONLY"] as const satisfies readonly VotingAccess[];

export interface IVotingItem {
  id: string;
  title: string;
  imageUrl?: string;
  order: number;
}

export interface IVoting extends Document {
  _id: mongoose.Types.ObjectId;
  /** Short, URL-friendly id used in shareable links (`/v/<shareId>`). */
  shareId: string;
  title: string;
  description?: string;
  ownerId: mongoose.Types.ObjectId;
  ownerEmail: string;
  status: VotingStatus;
  access: VotingAccess;
  /** Emails invited to vote when access === INVITE_ONLY. Lowercased. */
  invitedEmails: string[];
  items: IVotingItem[];
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new mongoose.Schema<IVotingItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    imageUrl: String,
    order: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const votingSchema = new mongoose.Schema<IVoting>(
  {
    shareId: { type: String, required: true, unique: true, default: () => shortId(10) },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerEmail: { type: String, required: true, lowercase: true },
    status: { type: String, enum: VOTING_STATUSES, default: "OPEN" },
    access: { type: String, enum: VOTING_ACCESSES, default: "LINK" },
    invitedEmails: { type: [String], default: [] },
    items: { type: [itemSchema], default: [] },
    finishedAt: Date,
  },
  { timestamps: true },
);

export const VotingModel: Model<IVoting> =
  (mongoose.models.Voting as Model<IVoting> | undefined) ??
  mongoose.model<IVoting>("Voting", votingSchema);
