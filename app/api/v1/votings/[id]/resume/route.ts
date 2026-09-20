import { requireThrottledUser } from "@/server/guards";
import { ok, route } from "@/server/http";
import { toVotingDto } from "@/server/voting/board-view";
import * as votingService from "@/server/voting/voting.service";

export const POST = route<{ id: string }>(async (req, { id }) => {
  const user = await requireThrottledUser(req);
  const v = await votingService.resume(id, user.userId);
  return ok(toVotingDto(v, user.userId));
});
