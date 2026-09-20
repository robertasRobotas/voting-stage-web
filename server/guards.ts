import { requireUser, type RequestUser } from "./auth";
import { RATE_LIMITS, consume } from "./rate-limit";

/** Signed-in caller about to change a board. Throttled per user, not per IP. */
export async function requireThrottledUser(req: Request): Promise<RequestUser> {
  const user = await requireUser(req);
  await consume(`owner:${user.userId}`, RATE_LIMITS.ownerMutation);
  return user;
}
