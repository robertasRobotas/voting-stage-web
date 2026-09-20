import type { NextRequest } from "next/server";
import type { z } from "zod";
import { connectDb } from "./db";
import { AppError, ValidationError } from "./errors";

export function ok<T>(data: T, init?: { status?: number; message?: string }): Response {
  return Response.json(
    { success: true, data, ...(init?.message && { message: init.message }) },
    { status: init?.status ?? 200 },
  );
}

export function created<T>(data: T): Response {
  return ok(data, { status: 201 });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

function fail(status: number, code: string, message: string, details?: unknown): Response {
  return Response.json(
    { success: false, error: { code, message, ...(details !== undefined && { details }) } },
    { status },
  );
}

function errorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) console.error(err);
    return fail(err.statusCode, err.code, err.message, err.details);
  }
  // Two owner tabs saving the same board at once: Mongoose's optimistic
  // concurrency check rejects the second save. That's a conflict, not a crash.
  if (err instanceof Error && err.name === "VersionError") {
    return fail(409, "CONFLICT", "This board was changed elsewhere — reload and try again.");
  }
  console.error("Unhandled API error", err);
  return fail(500, "INTERNAL_ERROR", "An unexpected error occurred");
}

type Handler<P> = (req: NextRequest, params: P) => Promise<Response>;

/**
 * Wrap a route handler: make sure the DB is connected, resolve the (async)
 * route params, and turn thrown errors into the API's JSON error envelope.
 */
export function route<P = Record<string, never>>(handler: Handler<P>) {
  return async (req: NextRequest, ctx: { params: Promise<P> }): Promise<Response> => {
    try {
      await connectDb();
      return await handler(req, await ctx.params);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Parse + validate a JSON body. Replaces the parsed value with zod's output. */
export async function parseBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new ValidationError("Validation failed", result.error.flatten());
  return result.data;
}

/**
 * Caller's IP. On Vercel `x-forwarded-for` is set by the platform (any value
 * the client sent is overwritten), so the first entry is trustworthy there.
 * Behind a different proxy, make sure it does the same before relying on this.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || "unknown";
}
