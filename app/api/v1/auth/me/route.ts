import { requireUser } from "@/server/auth";
import { ok, route } from "@/server/http";

// Returns the current user. Creates the DB record on first call as a side
// effect, so the frontend can hit this right after Firebase sign-in.
export const GET = route(async (req) => {
  const u = await requireUser(req);
  return ok({ id: u.userId, email: u.email, displayName: u.displayName, photoUrl: u.photoUrl });
});
