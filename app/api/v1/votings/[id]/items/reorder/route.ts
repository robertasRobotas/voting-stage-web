import { requireThrottledUser } from "@/server/guards";
import { ok, parseBody, route } from "@/server/http";
import { toVotingDto } from "@/server/voting/board-view";
import { reorderItemsSchema } from "@/server/voting/voting.schemas";
import * as votingService from "@/server/voting/voting.service";

export const POST = route<{ id: string }>(async (req, { id }) => {
  const user = await requireThrottledUser(req);
  const { itemIds } = await parseBody(req, reorderItemsSchema);
  const v = await votingService.reorderItems(id, user.userId, itemIds);
  return ok(toVotingDto(v, user.userId));
});
