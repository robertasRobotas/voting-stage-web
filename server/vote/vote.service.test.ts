import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../voting/voting.repository", () => ({ findByIdOrShareId: vi.fn() }));
vi.mock("./vote.repository", () => ({ findExisting: vi.fn(), upsertBallot: vi.fn() }));
vi.mock("../rate-limit", () => ({
  consume: vi.fn(),
  hashIp: (ip: string) => `h(${ip})`,
  RATE_LIMITS: {
    votePerIdentity: { name: "identity" },
    votePerIp: { name: "ip" },
    newAnonBallotsPerIp: { name: "new-anon" },
  },
}));

import { RATE_LIMITS, consume } from "../rate-limit";
import * as votingRepo from "../voting/voting.repository";
import * as voteRepo from "./vote.repository";
import { castVote, type VoterIdentity } from "./vote.service";

const USER_ID = new mongoose.Types.ObjectId().toString();
const ANON_TOKEN = "3f0c8a52-7e1b-4a0e-9d55-0c1d2e3f4a5b";

function board(overrides: Record<string, unknown> = {}) {
  return {
    _id: new mongoose.Types.ObjectId(),
    status: "OPEN",
    access: "LINK",
    invitedEmails: [] as string[],
    items: [{ id: "a" }, { id: "b" }, { id: "c" }],
    ...overrides,
  };
}

const anon: VoterIdentity = { anonToken: ANON_TOKEN, ip: "1.2.3.4" };
const signedIn: VoterIdentity = {
  userId: USER_ID,
  verifiedEmail: "alice@example.com",
  displayName: "Alice",
  ip: "1.2.3.4",
};
const ballot = { allocations: [{ itemId: "a", points: 12 }, { itemId: "b", points: 10 }] };

function limitsConsumed(): unknown[] {
  return vi.mocked(consume).mock.calls.map(([, rule]) => rule);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(voteRepo.findExisting).mockResolvedValue(null);
  vi.mocked(voteRepo.upsertBallot).mockResolvedValue({ vote: {} as never, updated: false });
});

describe("castVote — board state", () => {
  it("404s for an unknown board", async () => {
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(null);
    await expect(castVote("nope", anon, ballot)).rejects.toMatchObject({ code: "VOTING_NOT_FOUND" });
  });

  it("rejects votes on a finished board", async () => {
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(board({ status: "FINISHED" }) as never);
    await expect(castVote("x", anon, ballot)).rejects.toMatchObject({ code: "VOTING_CLOSED" });
    expect(voteRepo.upsertBallot).not.toHaveBeenCalled();
  });
});

describe("castVote — access rules", () => {
  it("lets an anonymous voter vote on a LINK board", async () => {
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(board() as never);
    await castVote("x", anon, ballot);
    expect(voteRepo.upsertBallot).toHaveBeenCalledWith(
      expect.anything(),
      { anonToken: ANON_TOKEN },
      expect.objectContaining({ allocations: ballot.allocations }),
    );
  });

  it("requires an anon token when not signed in", async () => {
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(board() as never);
    await expect(castVote("x", { ip: "1.2.3.4" }, ballot)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("requires sign-in on a SIGNED_IN board", async () => {
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(board({ access: "SIGNED_IN" }) as never);
    await expect(castVote("x", anon, ballot)).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    await expect(castVote("x", signedIn, ballot)).resolves.toBeDefined();
  });

  it("requires sign-in on an INVITE_ONLY board", async () => {
    const b = board({ access: "INVITE_ONLY", invitedEmails: ["alice@example.com"] });
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(b as never);
    await expect(castVote("x", anon, ballot)).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
  });

  it("refuses an invited address that isn't verified", async () => {
    const b = board({ access: "INVITE_ONLY", invitedEmails: ["alice@example.com"] });
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(b as never);
    const unverified = { ...signedIn, verifiedEmail: undefined };
    await expect(castVote("x", unverified, ballot)).rejects.toMatchObject({
      code: "EMAIL_NOT_VERIFIED",
    });
  });

  it("refuses a verified address that isn't on the list", async () => {
    const b = board({ access: "INVITE_ONLY", invitedEmails: ["bob@example.com"] });
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(b as never);
    await expect(castVote("x", signedIn, ballot)).rejects.toMatchObject({ code: "NOT_INVITED" });
  });

  it("accepts an invited, verified voter and records their email + account name", async () => {
    const b = board({ access: "INVITE_ONLY", invitedEmails: ["alice@example.com"] });
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(b as never);
    await castVote("x", signedIn, { ...ballot, voterName: "Not Alice" });
    expect(voteRepo.upsertBallot).toHaveBeenCalledWith(
      b._id,
      { userId: USER_ID },
      expect.objectContaining({ voterEmail: "alice@example.com", voterName: "Alice" }),
    );
  });

  it("ignores the anon token of a signed-in voter", async () => {
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(board() as never);
    await castVote("x", { ...signedIn, anonToken: ANON_TOKEN }, ballot);
    expect(voteRepo.upsertBallot).toHaveBeenCalledWith(
      expect.anything(),
      { userId: USER_ID },
      expect.anything(),
    );
  });
});

describe("castVote — ballot validation", () => {
  beforeEach(() => {
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(board() as never);
  });

  it("rejects unknown items", async () => {
    await expect(
      castVote("x", anon, { allocations: [{ itemId: "zzz", points: 12 }] }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects giving one item two point values", async () => {
    await expect(
      castVote("x", anon, {
        allocations: [{ itemId: "a", points: 12 }, { itemId: "a", points: 10 }],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects reusing a point value", async () => {
    await expect(
      castVote("x", anon, {
        allocations: [{ itemId: "a", points: 12 }, { itemId: "b", points: 12 }],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(voteRepo.upsertBallot).not.toHaveBeenCalled();
  });
});

describe("castVote — rate limiting", () => {
  beforeEach(() => {
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(board() as never);
  });

  it("limits anonymous voters by IP too, and counts a first ballot against the stuffing cap", async () => {
    await castVote("x", anon, ballot);
    expect(limitsConsumed()).toEqual([
      RATE_LIMITS.votePerIdentity,
      RATE_LIMITS.votePerIp,
      RATE_LIMITS.newAnonBallotsPerIp,
    ]);
    // The IP-keyed counters must not depend on the client-chosen token.
    const ipKeys = vi.mocked(consume).mock.calls.slice(1).map(([key]) => key);
    for (const key of ipKeys) {
      expect(key).toContain("h(1.2.3.4)");
      expect(key).not.toContain(ANON_TOKEN);
    }
  });

  it("doesn't count an edit of an existing anonymous ballot as a new one", async () => {
    vi.mocked(voteRepo.findExisting).mockResolvedValue({} as never);
    await castVote("x", anon, ballot);
    expect(limitsConsumed()).not.toContain(RATE_LIMITS.newAnonBallotsPerIp);
  });

  it("limits signed-in voters per account only", async () => {
    await castVote("x", signedIn, ballot);
    expect(limitsConsumed()).toEqual([RATE_LIMITS.votePerIdentity]);
  });

  it("stops before saving when a limit is hit", async () => {
    vi.mocked(consume).mockRejectedValueOnce(new Error("limited"));
    await expect(castVote("x", anon, ballot)).rejects.toThrow("limited");
    expect(voteRepo.upsertBallot).not.toHaveBeenCalled();
  });
});
