/**
 * Per-board anonymous voter token. Stored in localStorage so the same browser
 * can't vote twice on the same board (and to re-open a previous vote session).
 *
 * Keyed by shareId so a voter who votes on multiple boards has distinct tokens.
 */
const STORAGE_PREFIX = "voting-stage:anon:";

/** Must match the server's check (`anonTokenSchema`). */
const VALID_TOKEN = /^[A-Za-z0-9_-]{8,64}$/;

function key(shareId: string): string {
  return `${STORAGE_PREFIX}${shareId}`;
}

function randomToken(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // `randomUUID` needs a secure context (https / localhost). Plain-http LAN
  // testing falls back to getRandomValues, which is available everywhere.
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateAnonToken(shareId: string): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(key(shareId));
  if (existing && VALID_TOKEN.test(existing)) return existing;
  const token = randomToken();
  window.localStorage.setItem(key(shareId), token);
  return token;
}

export function getAnonToken(shareId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key(shareId));
}
