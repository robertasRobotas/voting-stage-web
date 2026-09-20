import { randomBytes } from "node:crypto";

/** URL-safe random id (A–Z a–z 0–9 - _), ~6 bits of entropy per character. */
export function shortId(length: number): string {
  return randomBytes(length).toString("base64url").slice(0, length);
}
