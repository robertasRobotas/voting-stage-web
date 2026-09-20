import mongoose from "mongoose";

/**
 * Cached MongoDB connection. On serverless hosts (Vercel) every function
 * instance is reused across many requests, and in dev the module is re-evaluated
 * on each hot reload — stashing the promise on `globalThis` makes both cases
 * share one connection instead of opening a new one per request.
 */
const globalCache = globalThis as typeof globalThis & {
  __mongooseConn?: Promise<typeof mongoose>;
};

export function connectDb(): Promise<typeof mongoose> {
  if (!globalCache.__mongooseConn) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      return Promise.reject(new Error("MONGODB_URI is not set — add it to .env.local"));
    }
    globalCache.__mongooseConn = mongoose
      .connect(uri, {
        // Fail fast instead of queueing queries while the DB is unreachable.
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000,
        // Serverless instances handle one request at a time; keep the pool small
        // so many warm instances don't exhaust the Atlas free-tier limit.
        maxPoolSize: 5,
      })
      .catch((err) => {
        // Let the next request retry rather than caching the failure forever.
        globalCache.__mongooseConn = undefined;
        throw err;
      });
  }
  return globalCache.__mongooseConn;
}
