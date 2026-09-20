"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

/** The only part of the marketing pages that depends on sign-in state. */
export function HomeCta({ label = "Create a free voting board" }: { label?: string }) {
  const { user, configured, ready } = useAuth();

  if (!configured) {
    return (
      <button className="btn btn-primary btn-lg" disabled>
        Firebase not configured
      </button>
    );
  }
  // Until auth settles, link to /login — it forwards signed-in users onward.
  const href = ready && user ? "/votings/new" : "/login?next=/votings/new";
  return (
    <Link href={href} className="btn btn-primary btn-lg">
      {label}
    </Link>
  );
}
