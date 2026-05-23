/**
 * Frontend runtime config. The only knob is the API URL.
 *
 * - Local dev: falls back to http://localhost:3002/api/v1.
 * - Production (Vercel/Render/etc): set NEXT_PUBLIC_API_URL in the host's
 *   env-var settings.
 *
 * Note: the `NEXT_PUBLIC_` prefix is mandatory — Next.js only exposes vars
 * with that prefix to the browser bundle.
 */
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1",
};
