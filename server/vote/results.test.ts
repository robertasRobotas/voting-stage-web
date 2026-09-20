import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import type { VoteFields } from "../models/vote";
import { computeResults, isEligibleVote, toVoterRecords } from "./results";

function vote(overrides: Partial<VoteFields>): VoteFields {
  return {
    _id: new mongoose.Types.ObjectId(),
    votingId: new mongoose.Types.ObjectId(),
    allocations: [],
    createdAt: new Date("2026-01-01T10:00:00Z"),
    updatedAt: new Date("2026-01-01T10:00:00Z"),
    ...overrides,
  };
}

describe("isEligibleVote", () => {
  const signedIn = vote({ userId: new mongoose.Types.ObjectId(), voterEmail: "alice@example.com" });
  const anonymous = vote({ anonToken: "token-123456" });

  it("counts everything on a LINK board", () => {
    const board = { access: "LINK" as const, invitedEmails: [] };
    expect(isEligibleVote(board, signedIn)).toBe(true);
    expect(isEligibleVote(board, anonymous)).toBe(true);
  });

  it("drops anonymous ballots once the board requires sign-in", () => {
    const board = { access: "SIGNED_IN" as const, invitedEmails: [] };
    expect(isEligibleVote(board, signedIn)).toBe(true);
    expect(isEligibleVote(board, anonymous)).toBe(false);
  });

  it("drops ballots from people who are not (or no longer) invited", () => {
    const invited = { access: "INVITE_ONLY" as const, invitedEmails: ["alice@example.com"] };
    const uninvited = { access: "INVITE_ONLY" as const, invitedEmails: ["bob@example.com"] };
    expect(isEligibleVote(invited, signedIn)).toBe(true);
    expect(isEligibleVote(uninvited, signedIn)).toBe(false);
    expect(isEligibleVote(invited, anonymous)).toBe(false);
  });
});

describe("computeResults", () => {
  const votes = [
    vote({ allocations: [{ itemId: "a", points: 12 }, { itemId: "b", points: 10 }] }),
    vote({ allocations: [{ itemId: "b", points: 12 }, { itemId: "gone", points: 10 }] }),
  ];

  it("tallies points per item, highest first", () => {
    const r = computeResults(votes, new Set(["a", "b"]));
    expect(r.totalVotes).toBe(2);
    expect(r.perItem.map((row) => [row.itemId, row.totalPoints])).toEqual([
      ["b", 22],
      ["a", 12],
    ]);
    expect(r.perItem[0].pointsBreakdown).toEqual({ "10": 1, "12": 1 });
  });

  it("ignores allocations for items that were removed", () => {
    const r = computeResults(votes, new Set(["a", "b"]));
    expect(r.perItem.some((row) => row.itemId === "gone")).toBe(false);
  });
});

describe("toVoterRecords", () => {
  const votes = [
    vote({
      voterEmail: "late@example.com",
      userId: new mongoose.Types.ObjectId(),
      createdAt: new Date("2026-01-02T10:00:00Z"),
      allocations: [{ itemId: "a", points: 12 }, { itemId: "gone", points: 10 }],
    }),
    vote({ voterName: "Early", anonToken: "token-123456" }),
  ];

  it("sorts oldest first and strips removed items", () => {
    const records = toVoterRecords(votes, new Set(["a"]), { includeEmails: true });
    expect(records.map((r) => r.voterName ?? r.voterEmail)).toEqual(["Early", "late@example.com"]);
    expect(records[1].allocations).toEqual([{ itemId: "a", points: 12 }]);
    expect(records[0].isAnonymous).toBe(true);
    expect(records[1].isSignedIn).toBe(true);
  });

  it("never exposes emails unless asked to", () => {
    const records = toVoterRecords(votes, new Set(["a"]), { includeEmails: false });
    expect(records.every((r) => r.voterEmail === undefined)).toBe(true);
  });
});
