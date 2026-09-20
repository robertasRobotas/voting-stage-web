import { requireThrottledUser } from "@/server/guards";
import { ok, parseBody, route } from "@/server/http";
import { toVotingDto } from "@/server/voting/board-view";
import { updateSettingsSchema } from "@/server/voting/voting.schemas";
import * as votingService from "@/server/voting/voting.service";

export const PATCH = route<{ id: string }>(async (req, { id }) => {
  const user = await requireThrottledUser(req);
  const input = await parseBody(req, updateSettingsSchema);
  const v = await votingService.updateSettings(id, user.userId, input);
  return ok(toVotingDto(v, user.userId));
});
