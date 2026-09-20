import { optionalUser } from "@/server/auth";
import { ok, route } from "@/server/http";
import { getBoardView } from "@/server/voting/board-view";

export const GET = route<{ shareId: string }>(async (req, { shareId }) => {
  const viewer = await optionalUser(req);
  return ok(await getBoardView(shareId, viewer));
});
