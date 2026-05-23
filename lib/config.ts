/**
 * Single place to switch the frontend between environments.
 *
 * Selection rules (top wins):
 *   1. `NEXT_PUBLIC_API_URL` (escape hatch) — used verbatim if set.
 *   2. `NODE_ENV` — set automatically by Next.js: `development` during
 *      `next dev`, `production` during `next build` / `next start`. Render
 *      and Vercel both run a production build, so deploys pick "production"
 *      with zero config.
 *   3. Falls back to "development".
 */

const environments = {
  development: {
    apiUrl: "http://localhost:3002/api/v1",
  },
  production: {
    apiUrl: "https://voting-stage-web.onrender.com/api/v1",
  },
} as const;

export type EnvName = keyof typeof environments;

function pickEnv(): EnvName {
  // `test` (jest/vitest) — bucket with development.
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

const activeEnv = pickEnv();
const apiUrlOverride = process.env.NEXT_PUBLIC_API_URL;

export const config = {
  environment: activeEnv,
  apiUrl:
    apiUrlOverride && apiUrlOverride.length > 0
      ? apiUrlOverride
      : environments[activeEnv].apiUrl,
};

export const ALL_ENVIRONMENTS = environments;
