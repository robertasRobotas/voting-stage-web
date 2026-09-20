/**
 * Frontend runtime config. The only knob is the API URL.
 *
 * The API lives in this same Next.js app (`app/api/v1`), so the default is a
 * same-origin relative path and nothing needs configuring. Set
 * NEXT_PUBLIC_API_URL only to point the UI at an API hosted somewhere else.
 */
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "/api/v1",
};
