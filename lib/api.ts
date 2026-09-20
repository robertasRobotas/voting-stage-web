import { config } from "./config";
import { firebaseConfigured, getFirebase } from "./firebase";

const API_BASE = config.apiUrl;

export interface ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  anonToken?: string | null;
}

/**
 * The token held in React state can be stale — a laptop that slept past the
 * one-hour expiry, a throttled background tab. `getIdToken()` returns the
 * cached token while it's valid and transparently refreshes it when it isn't,
 * so ask Firebase right before each request and only fall back to the state copy.
 */
async function freshToken(fallback: string): Promise<string> {
  if (!firebaseConfigured) return fallback;
  try {
    const current = getFirebase().auth.currentUser;
    return current ? await current.getIdToken() : fallback;
  } catch {
    return fallback;
  }
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["Authorization"] = `Bearer ${await freshToken(opts.token)}`;
  if (opts.anonToken) headers["X-Anon-Token"] = opts.anonToken;

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // No body — fine for 204.
  }

  if (!res.ok) {
    const j = (json ?? {}) as { error?: { message?: string; code?: string; details?: unknown } };
    const err = new Error(j.error?.message ?? `Request failed (${res.status})`) as ApiError;
    err.status = res.status;
    err.code = j.error?.code;
    err.details = j.error?.details;
    throw err;
  }

  const body = (json ?? {}) as { data?: T };
  return body.data as T;
}
