import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./voting.repository", () => ({
  create: vi.fn(async (data: unknown) => data),
  findByIdOrShareId: vi.fn(),
  deleteById: vi.fn(),
}));
vi.mock("../vote/vote.repository", () => ({ deleteByVoting: vi.fn() }));

import * as voteRepo from "../vote/vote.repository";
import * as votingRepo from "./voting.repository";
import * as service from "./voting.service";

const OWNER = new mongoose.Types.ObjectId().toString();
const STRANGER = new mongoose.Types.ObjectId().toString();

interface BoardDouble {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  status: string;
  access: string;
  invitedEmails: string[];
  items: Array<{ id: string; title: string; imageUrl?: string; order: number }>;
  finishedAt?: Date;
  save: ReturnType<typeof vi.fn>;
}

/** Stand-in for a Mongoose document: plain fields plus a spy-able save(). */
function board(overrides: Partial<BoardDouble> = {}): BoardDouble {
  const doc: BoardDouble = {
    _id: new mongoose.Types.ObjectId(),
    ownerId: new mongoose.Types.ObjectId(OWNER),
    status: "OPEN",
    access: "LINK",
    invitedEmails: [],
    items: [
      { id: "a", title: "A", order: 0 },
      { id: "b", title: "B", order: 1 },
      { id: "c", title: "C", order: 2 },
    ],
    save: vi.fn(async () => undefined),
    ...overrides,
  };
  vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(doc as never);
  return doc;
}

beforeEach(() => vi.clearAllMocks());

describe("ownership", () => {
  it.each([
    ["finish", () => service.finish("x", STRANGER)],
    ["resume", () => service.resume("x", STRANGER)],
    ["updateSettings", () => service.updateSettings("x", STRANGER, { title: "hijacked" })],
    ["addItem", () => service.addItem("x", STRANGER, { title: "D" })],
    ["updateItem", () => service.updateItem("x", STRANGER, "a", { title: "Z" })],
    ["removeItem", () => service.removeItem("x", STRANGER, "a")],
    ["reorderItems", () => service.reorderItems("x", STRANGER, ["c", "b", "a"])],
    ["deleteVoting", () => service.deleteVoting("x", STRANGER)],
  ])("%s is refused for anyone but the creator", async (_name, call) => {
    const doc = board();
    await expect(call()).rejects.toMatchObject({ code: "NOT_OWNER" });
    expect(doc.save).not.toHaveBeenCalled();
    expect(voteRepo.deleteByVoting).not.toHaveBeenCalled();
    expect(votingRepo.deleteById).not.toHaveBeenCalled();
  });

  it("404s when the board doesn't exist", async () => {
    vi.mocked(votingRepo.findByIdOrShareId).mockResolvedValue(null);
    await expect(service.finish("x", OWNER)).rejects.toMatchObject({ code: "VOTING_NOT_FOUND" });
  });
});

describe("finished boards keep their line-up", () => {
  it.each([
    ["addItem", () => service.addItem("x", OWNER, { title: "D" })],
    ["updateItem", () => service.updateItem("x", OWNER, "a", { title: "Z" })],
    ["removeItem", () => service.removeItem("x", OWNER, "a")],
  ])("%s is blocked until the board is resumed", async (_name, call) => {
    const doc = board({ status: "FINISHED" });
    await expect(call()).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(doc.save).not.toHaveBeenCalled();
  });

  it("resume reopens the board and clears finishedAt", async () => {
    const doc = board({ status: "FINISHED", finishedAt: new Date() });
    await service.resume("x", OWNER);
    expect(doc.status).toBe("OPEN");
    expect(doc.finishedAt).toBeUndefined();
    expect(doc.save).toHaveBeenCalled();
  });
});

describe("items", () => {
  it("removes an item and renumbers the rest", async () => {
    const doc = board();
    await service.removeItem("x", OWNER, "a");
    expect(doc.items.map((i) => [i.id, i.order])).toEqual([["b", 0], ["c", 1]]);
  });

  it("won't go below two items", async () => {
    board({ items: [{ id: "a", title: "A", order: 0 }, { id: "b", title: "B", order: 1 }] });
    await expect(service.removeItem("x", OWNER, "a")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("404s for an unknown item", async () => {
    board();
    await expect(service.removeItem("x", OWNER, "zzz")).rejects.toMatchObject({
      code: "ITEM_NOT_FOUND",
    });
  });

  it("clears an image with an empty string, leaves it alone when absent", async () => {
    const doc = board({ items: [{ id: "a", title: "A", imageUrl: "https://x/y.png", order: 0 }] });
    await service.updateItem("x", OWNER, "a", { title: "New" });
    expect(doc.items[0]).toMatchObject({ title: "New", imageUrl: "https://x/y.png" });
    await service.updateItem("x", OWNER, "a", { imageUrl: "" });
    expect(doc.items[0].imageUrl).toBeUndefined();
  });

  it("reorders only with the exact set of item ids", async () => {
    const doc = board();
    await service.reorderItems("x", OWNER, ["c", "a", "b"]);
    expect(doc.items.map((i) => [i.id, i.order])).toEqual([["c", 0], ["a", 1], ["b", 2]]);

    for (const bad of [["a", "b"], ["a", "b", "zzz"], ["a", "a", "b"]]) {
      await expect(service.reorderItems("x", OWNER, bad)).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
      });
    }
  });
});

describe("invite lists", () => {
  it("lowercases and de-duplicates invited emails on create", async () => {
    const created = await service.createVoting(OWNER, "Owner@Example.com", {
      title: "t",
      access: "INVITE_ONLY",
      invitedEmails: ["Alice@Example.com", "alice@example.com", "bob@example.com"],
      items: [{ title: "A" }, { title: "B" }],
    });
    expect(created.invitedEmails).toEqual(["alice@example.com", "bob@example.com"]);
    expect(created.ownerEmail).toBe("owner@example.com");
    expect(new Set(created.items.map((i) => i.id)).size).toBe(2);
  });

  it("refuses an invite-only board with nobody invited", async () => {
    await expect(
      service.createVoting(OWNER, "o@example.com", {
        title: "t",
        access: "INVITE_ONLY",
        invitedEmails: [],
        items: [{ title: "A" }, { title: "B" }],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    const doc = board();
    await expect(
      service.updateSettings("x", OWNER, { access: "INVITE_ONLY" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(doc.save).not.toHaveBeenCalled();
  });
});

describe("deleteVoting", () => {
  it("removes the ballots, then the board", async () => {
    const doc = board();
    const order: string[] = [];
    vi.mocked(voteRepo.deleteByVoting).mockImplementation(async () => void order.push("votes"));
    vi.mocked(votingRepo.deleteById).mockImplementation(async () => void order.push("board"));
    await service.deleteVoting("x", OWNER);
    expect(order).toEqual(["votes", "board"]);
    expect(voteRepo.deleteByVoting).toHaveBeenCalledWith(doc._id);
  });
});
