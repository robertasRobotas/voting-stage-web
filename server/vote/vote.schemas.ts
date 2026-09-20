import { z } from "zod";
import { EUROVISION_POINTS } from "@/lib/types";

export const castVoteSchema = z.object({
  /** Optional display name for anonymous voters (shown next to their points). */
  voterName: z.string().trim().min(1).max(80).optional(),
  allocations: z
    .array(
      z.object({
        itemId: z.string().min(1).max(64),
        points: z
          .number()
          .int()
          .refine((p) => (EUROVISION_POINTS as readonly number[]).includes(p), {
            message: `points must be one of ${EUROVISION_POINTS.join(", ")}`,
          }),
      }),
    )
    .min(1)
    .max(EUROVISION_POINTS.length),
});
export type CastVoteInput = z.infer<typeof castVoteSchema>;

/**
 * Anonymous voter token from the `X-Anon-Token` header. It ends up as an
 * indexed database value, so it must look like an id (a UUID from the client),
 * not an arbitrary blob.
 */
export const anonTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);
