import { optionalUser } from "@/server/auth";
import { ok, route } from "@/server/http";
import { readAnonToken } from "@/server/vote/anon-token";
import * as voteService from "@/server/vote/vote.service";

export const GET = route<{ id: string }>(async (req, { id }) => {
  const user = await optionalUser(req);
  const vote = await voteService.getMyVote(id, {
    userId: user?.userId,
    anonToken: user ? undefined : readAnonToken(req),
  });
  return ok({
    voted: !!vote,
    allocations: vote ? vote.allocations.map((a) => ({ itemId: a.itemId, points: a.points })) : [],
    voterName: vote?.voterName,
    castAt: vote?.createdAt,
    updatedAt: vote?.updatedAt,
  });
});
