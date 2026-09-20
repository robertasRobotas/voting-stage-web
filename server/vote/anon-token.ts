import { ValidationError } from "../errors";
import { anonTokenSchema } from "./vote.schemas";

/** Read + validate the anonymous voter token header. Absent → undefined. */
export function readAnonToken(req: Request): string | undefined {
  const raw = req.headers.get("x-anon-token")?.trim();
  if (!raw) return undefined;
  const parsed = anonTokenSchema.safeParse(raw);
  if (!parsed.success) throw new ValidationError("X-Anon-Token is malformed");
  return parsed.data;
}
