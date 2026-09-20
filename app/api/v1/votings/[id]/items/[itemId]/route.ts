import { requireThrottledUser } from "@/server/guards";
import { ok, parseBody, route } from "@/server/http";
import { toVotingDto } from "@/server/voting/board-view";
import { updateItemSchema } from "@/server/voting/voting.schemas";
import * as votingService from "@/server/voting/voting.service";

type Params = { id: string; itemId: string };

export const PATCH = route<Params>(async (req, { id, itemId }) => {
  const user = await requireThrottledUser(req);
  const input = await parseBody(req, updateItemSchema);
  const v = await votingService.updateItem(id, user.userId, itemId, input);
  return ok(toVotingDto(v, user.userId));
});

export const DELETE = route<Params>(async (req, { id, itemId }) => {
  const user = await requireThrottledUser(req);
  const v = await votingService.removeItem(id, user.userId, itemId);
  return ok(toVotingDto(v, user.userId));
});
