import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./voting.repository", () => ({ findByShareId: vi.fn() }));
vi.mock("../vote/vote.repository", () => ({ listByVoting: vi.fn() }));

import type { RequestUser } from "../auth";
import * as voteRepo from "../vote/vote.repository";
import { getBoardView } from "./board-view";
import * as votingRepo from "./voting.repository";

const OWNER_ID = new mongoose.Types.ObjectId();

const owner: RequestUser = {
  userId: OWNER_ID.toString(),
  firebaseUid: "fb-owner",
  email: "owner@example.com",
  verifiedEmail: "owner@example.com",
};
const alice: RequestUser = {
  userId: new mongoose.Types.ObjectId().toString(),
  firebaseUid: "fb-alice",
  email: "alice@example.com",
  verifiedEmail: "alice@example.com",
};

function board(overrides: Record<string, unknown> = {}) {
  const doc = {
    _id: new mongoose.Types.ObjectId(),
    shareId: "share12345",
    title: "Best song",
    ownerId: OWNER_ID,
    ownerEmail: "owner@example.com",
    status: "OPEN",
    access: "LINK",
    invitedEmails: ["alice@example.com"],
    items: [
      { id: "a", title: "A", order: 1 },
      { id: "b", title: "B", order: 0 },
    ],
    createdAt: new Date(),
    ...overrides,
  };
  vi.mocked(votingRepo.findByShareId).mockResolvedValue(doc as never);
  return doc;
}

const votes = [
  {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    voterEmail: "alice@example.com",
    voterName: "Alice",
    allocations: [{ itemId: "a", points: 12 }],
    createdAt: new Date("2026-01-01"),
  },
  {
    _id: new mongoose.Types.ObjectId(),
    anonToken: "token-123456",
    voterName: "Drive-by",
    allocations: [{ itemId: "b", points: 12 }],
    createdAt: new Date("2026-01-02"),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(voteRepo.listByVoting).mockResolvedValue(votes as never);
});

describe("getBoardView — who sees what", () => {
  it("hides results, voters and owner-only fields from visitors while voting is open", async () => {
    board();
    const view = await getBoardView("share12345", alice);
    expect(view).not.toHaveProperty("results");
    expect(view).not.toHaveProperty("voters");
    expect(view.invitedEmails).toBeUndefined();
    expect(view.ownerEmail).toBeUndefined();
    expect(view.isOwner).toBe(false);
    // …and doesn't even load the ballots.
    expect(voteRepo.listByVoting).not.toHaveBeenCalled();
  });

  it("shows the owner live results with voter emails, from a single votes query", async () => {
    board();
    const view = await getBoardView("share12345", owner);
    expect(view.isOwner).toBe(true);
    expect(view.invitedEmails).toEqual(["alice@example.com"]);
    expect(view).toHaveProperty("results.totalVotes", 2);
    expect(view).toHaveProperty("voters.0.voterEmail", "alice@example.com");
    expect(voteRepo.listByVoting).toHaveBeenCalledTimes(1);
  });

  it("shows everyone the results once finished — but never emails", async () => {
    board({ status: "FINISHED" });
    const view = await getBoardView("share12345", undefined);
    expect(view).toHaveProperty("results.totalVotes", 2);
    expect(view).toHaveProperty("results.ineligibleVotes", undefined);
    const voters = (view as { voters: Array<{ voterEmail?: string }> }).voters;
    expect(voters).toHaveLength(2);
    expect(voters.every((v) => v.voterEmail === undefined)).toBe(true);
  });

  it("returns items in display order", async () => {
    board();
    const view = await getBoardView("share12345", undefined);
    expect(view.items.map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("leaves out ballots that the current access setting no longer allows", async () => {
    board({ access: "INVITE_ONLY" });
    const view = await getBoardView("share12345", owner);
    expect(view).toHaveProperty("results.totalVotes", 1);
    expect(view).toHaveProperty("results.ineligibleVotes", 1);
    expect(view).toHaveProperty("voters.length", 1);
  });
});

describe("getBoardView — canVote", () => {
  it("LINK: anyone, while open", async () => {
    board();
    expect((await getBoardView("s", undefined)).canVote).toBe(true);
    board({ status: "FINISHED" });
    expect((await getBoardView("s", undefined)).canVote).toBe(false);
  });

  it("SIGNED_IN: only signed-in viewers", async () => {
    board({ access: "SIGNED_IN" });
    expect((await getBoardView("s", undefined)).canVote).toBe(false);
    expect((await getBoardView("s", alice)).canVote).toBe(true);
  });

  it("INVITE_ONLY: only invited, verified emails", async () => {
    board({ access: "INVITE_ONLY" });
    expect((await getBoardView("s", undefined)).canVote).toBe(false);
    expect((await getBoardView("s", alice)).canVote).toBe(true);
    expect((await getBoardView("s", { ...alice, verifiedEmail: undefined })).canVote).toBe(false);
    expect((await getBoardView("s", owner)).canVote).toBe(false);
  });
});
