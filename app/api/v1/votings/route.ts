import { requireUser } from "@/server/auth";
import { created, ok, parseBody, route } from "@/server/http";
import { RATE_LIMITS, consume } from "@/server/rate-limit";
import { toVotingDto } from "@/server/voting/board-view";
import { createVotingSchema } from "@/server/voting/voting.schemas";
import * as votingService from "@/server/voting/voting.service";

export const POST = route(async (req) => {
  const user = await requireUser(req);
  await consume(`create:${user.userId}`, RATE_LIMITS.createVoting);
  const input = await parseBody(req, createVotingSchema);
  const v = await votingService.createVoting(user.userId, user.email, input);
  return created(toVotingDto(v, user.userId));
});

export const GET = route(async (req) => {
  const user = await requireUser(req);
  const votings = await votingService.listMyVotings(user.userId);
  return ok(votings.map((v) => toVotingDto(v, user.userId)));
});
