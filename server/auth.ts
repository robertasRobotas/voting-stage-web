import { UnauthorizedError, isDuplicateKeyError } from "./errors";
import { firebaseProjectId, verifyFirebaseIdToken, type FirebaseClaims } from "./firebase-token";
import { UserModel, type IUser } from "./models/user";

export interface RequestUser {
  userId: string;
  firebaseUid: string;
  /** Profile email — may be unverified or a placeholder. Display only. */
  email: string;
  /**
   * Set only when the ID token says the address is verified. Anything that
   * grants access by email (invite-only boards) must use this, never `email`:
   * with a non-Google provider anyone can register somebody else's address.
   */
  verifiedEmail?: string;
  displayName?: string;
  photoUrl?: string;
}

function placeholderEmail(uid: string): string {
  return `${uid}@noemail.firebase`;
}

/**
 * Find the user for a Firebase uid, creating or refreshing the record as
 * needed. Reads first so the steady state is a single query; the write is an
 * upsert, so two parallel first requests can't both try to insert — and if
 * they still collide on the unique index, the loser just retries.
 */
export async function findOrCreateUser(claims: FirebaseClaims): Promise<IUser> {
  const email = claims.email?.toLowerCase();
  const existing = await UserModel.findOne({ firebaseUid: claims.uid });
  const upToDate =
    existing &&
    (!email || existing.email === email) &&
    (!claims.name || existing.displayName === claims.name) &&
    (!claims.picture || existing.photoUrl === claims.picture);
  if (upToDate) return existing;

  const set: Record<string, string> = {};
  if (email) set.email = email;
  if (claims.name) set.displayName = claims.name;
  if (claims.picture) set.photoUrl = claims.picture;
  // $set and $setOnInsert may not touch the same path, and older MongoDB
  // versions reject empty operators — so only include what's needed.
  const update: Record<string, Record<string, string>> = {};
  if (Object.keys(set).length > 0) update.$set = set;
  if (!email) update.$setOnInsert = { email: placeholderEmail(claims.uid) };
  const upsert = () =>
    UserModel.findOneAndUpdate({ firebaseUid: claims.uid }, update, { upsert: true, new: true });

  let user: IUser | null;
  try {
    user = await upsert();
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    user = await upsert();
  }
  if (!user) throw new Error("User upsert returned nothing");
  return user;
}

function bearerToken(req: Request): string | undefined {
  const header = req.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : undefined;
}

async function userFromToken(idToken: string): Promise<RequestUser> {
  // Only token problems become a 401. Database errors below propagate as 500s
  // — reporting an outage as "invalid token" would send clients into a
  // pointless sign-in loop.
  let claims: FirebaseClaims;
  try {
    claims = await verifyFirebaseIdToken(idToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired token", "TOKEN_INVALID");
  }

  const user = await findOrCreateUser(claims);
  return {
    userId: user._id.toString(),
    firebaseUid: user.firebaseUid,
    email: user.email,
    verifiedEmail: claims.emailVerified && claims.email ? claims.email.toLowerCase() : undefined,
    displayName: user.displayName,
    photoUrl: user.photoUrl,
  };
}

/** For endpoints that need a signed-in caller. */
export async function requireUser(req: Request): Promise<RequestUser> {
  if (!firebaseProjectId()) {
    throw new UnauthorizedError(
      "Firebase project id is not configured on the server",
      "AUTH_NOT_CONFIGURED",
    );
  }
  const token = bearerToken(req);
  if (!token) throw new UnauthorizedError("Missing or invalid authorization header");
  return userFromToken(token);
}

/**
 * For endpoints that serve both signed-in and anonymous callers. No token →
 * anonymous. A token that fails verification is a 401 rather than a silent
 * downgrade, so a signed-in voter can never be mistaken for an anonymous one.
 */
export async function optionalUser(req: Request): Promise<RequestUser | undefined> {
  const token = bearerToken(req);
  if (!token || !firebaseProjectId()) return undefined;
  return userFromToken(token);
}
