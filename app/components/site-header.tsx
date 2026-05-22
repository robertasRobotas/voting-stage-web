"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const { user, signOut, ready, configured } = useAuth();

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--background)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            color: "var(--foreground)",
            fontWeight: 700,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span aria-hidden style={{ fontSize: 22 }}>🎤</span>
          Voting Stage
        </Link>
        <nav className="row" style={{ gap: 8 }}>
          {!configured ? (
            <span className="small muted">Configure Firebase to sign in</span>
          ) : !ready ? null : user ? (
            <>
              <Link href="/dashboard" className="btn btn-ghost">
                My boards
              </Link>
              <span className="small muted" title={user.email ?? ""}>
                {user.displayName ?? user.email}
              </span>
              <button className="btn" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
