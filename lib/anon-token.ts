/**
 * Per-board anonymous voter token. Stored in localStorage so the same browser
 * can't vote twice on the same board (and to re-open a previous vote session).
 *
 * Keyed by shareId so a voter who votes on multiple boards has distinct tokens.
 */
const STORAGE_PREFIX = "voting-stage:anon:";

function key(shareId: string): string {
  return `${STORAGE_PREFIX}${shareId}`;
}

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getOrCreateAnonToken(shareId: string): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(key(shareId));
  if (existing) return existing;
  const token = randomToken();
  window.localStorage.setItem(key(shareId), token);
  return token;
}

export function getAnonToken(shareId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key(shareId));
}
