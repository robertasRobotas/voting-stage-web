const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parse a free-text list of emails (comma / semicolon / whitespace separated).
 * Returns deduped, lowercased valid emails plus whatever tokens didn't look
 * like an email, so forms can point at the exact offender instead of bouncing
 * off the server's generic validation error.
 */
export function parseEmailList(text: string): { emails: string[]; invalid: string[] } {
  const tokens = text
    .split(/[\s,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const emails = [...new Set(tokens.filter((t) => EMAIL_RE.test(t)))];
  const invalid = tokens.filter((t) => !EMAIL_RE.test(t));
  return { emails, invalid };
}
