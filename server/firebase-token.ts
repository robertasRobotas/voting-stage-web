import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Verify Firebase ID tokens without needing a service-account JSON.
 *
 * Firebase signs ID tokens as RS256 JWTs with rotating Google keys. We only
 * need the public JWKs (cached + auto-refreshed by `jose`) plus the project
 * id to validate `aud` / `iss`. This is exactly what `firebase-admin`'s
 * `verifyIdToken` does internally, minus the SDK and credential plumbing.
 */
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

/** Same Firebase project as the web SDK, so the public var doubles as server config. */
export function firebaseProjectId(): string | undefined {
  return process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || undefined;
}

export interface FirebaseClaims {
  uid: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<FirebaseClaims> {
  const projectId = firebaseProjectId();
  if (!projectId) throw new Error("Firebase project id is not configured");

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  const sub = typeof payload.sub === "string" ? payload.sub : undefined;
  if (!sub) throw new Error("Token missing sub claim");

  return {
    uid: sub,
    email: typeof payload.email === "string" ? payload.email : undefined,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}
