import { requireThrottledUser } from "@/server/guards";
import { created, parseBody, route } from "@/server/http";
import { toVotingDto } from "@/server/voting/board-view";
import { addItemSchema } from "@/server/voting/voting.schemas";
import * as votingService from "@/server/voting/voting.service";

export const POST = route<{ id: string }>(async (req, { id }) => {
  const user = await requireThrottledUser(req);
  const input = await parseBody(req, addItemSchema);
  const v = await votingService.addItem(id, user.userId, input);
  return created(toVotingDto(v, user.userId));
});
