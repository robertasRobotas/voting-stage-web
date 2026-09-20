import { optionalUser } from "@/server/auth";
import { clientIp, created, ok, parseBody, route } from "@/server/http";
import { readAnonToken } from "@/server/vote/anon-token";
import { castVoteSchema } from "@/server/vote/vote.schemas";
import * as voteService from "@/server/vote/vote.service";

export const POST = route<{ id: string }>(async (req, { id }) => {
  const user = await optionalUser(req);
  const input = await parseBody(req, castVoteSchema);
  const { vote, updated } = await voteService.castVote(
    id,
    {
      userId: user?.userId,
      verifiedEmail: user?.verifiedEmail,
      displayName: user?.displayName,
      // A signed-in caller's ballot is keyed by account, never by browser token.
      anonToken: user ? undefined : readAnonToken(req),
      ip: clientIp(req),
    },
    input,
  );
  const payload = { id: vote._id.toString(), allocations: vote.allocations, updated };
  return updated ? ok(payload, { message: "Ballot updated" }) : created(payload);
});
