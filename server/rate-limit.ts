import { createHash } from "node:crypto";
import mongoose, { type Model } from "mongoose";
import { RateLimitedError, isDuplicateKeyError } from "./errors";

/**
 * Fixed-window rate limiter backed by MongoDB.
 *
 * An in-memory limiter is useless on serverless hosting — every function
 * instance has its own memory, so counters neither add up nor survive. One
 * small upsert per limited request is cheap at this app's scale and needs no
 * extra service. Documents delete themselves through the TTL index.
 */
interface RateLimitDoc {
  key: string;
  count: number;
  expiresAt: Date;
}

const rateLimitSchema = new mongoose.Schema<RateLimitDoc>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

const RateLimitModel: Model<RateLimitDoc> =
  (mongoose.models.RateLimit as Model<RateLimitDoc> | undefined) ??
  mongoose.model<RateLimitDoc>("RateLimit", rateLimitSchema);

export interface RateLimitRule {
  /** Max hits per window. */
  limit: number;
  windowSeconds: number;
  message?: string;
}

async function increment(key: string, expiresAt: Date): Promise<number> {
  const doc = await RateLimitModel.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, new: true, lean: true },
  );
  return doc?.count ?? 1;
}

/** Count one hit against `key`; throws RateLimitedError once over the limit. */
export async function consume(key: string, rule: RateLimitRule): Promise<void> {
  const windowMs = rule.windowSeconds * 1000;
  const windowId = Math.floor(Date.now() / windowMs);
  const windowKey = `${key}:${windowId}`;
  const expiresAt = new Date((windowId + 1) * windowMs);

  let count: number;
  try {
    count = await increment(windowKey, expiresAt);
  } catch (err) {
    // Two first-hits in the same window can both try to insert; the loser
    // retries and lands on the $inc path.
    if (!isDuplicateKeyError(err)) throw err;
    count = await increment(windowKey, expiresAt);
  }
  if (count > rule.limit) throw new RateLimitedError(rule.message);
}

/** Raw IPs never hit the database — a short hash is enough to key a counter. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("base64url").slice(0, 16);
}

export const RATE_LIMITS = {
  /** Ballot submits by one signed-in user or one anonymous browser, per board. */
  votePerIdentity: { limit: 12, windowSeconds: 60, message: "Too many vote submissions, slow down." },
  /** Anonymous submits from one IP, per board. Generous: a whole party can share one Wi-Fi. */
  votePerIp: { limit: 60, windowSeconds: 60, message: "Too many vote submissions, slow down." },
  /** NEW anonymous ballots from one IP, per board. This is the ballot-stuffing cap. */
  newAnonBallotsPerIp: {
    limit: 40,
    windowSeconds: 60 * 60,
    message:
      "Too many new ballots from this network. Try again later, or ask the creator to require sign-in.",
  },
  createVoting: { limit: 20, windowSeconds: 60 * 60, message: "Too many boards created, try later." },
  ownerMutation: { limit: 120, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitRule>;
