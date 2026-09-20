import { requireThrottledUser } from "@/server/guards";
import { noContent, route } from "@/server/http";
import * as votingService from "@/server/voting/voting.service";

export const DELETE = route<{ id: string }>(async (req, { id }) => {
  const user = await requireThrottledUser(req);
  await votingService.deleteVoting(id, user.userId);
  return noContent();
});
