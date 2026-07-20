"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function SiteHeader() {
  const { user, signOut, ready, configured } = useAuth();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden>
            <BrandMark />
          </span>
          Voting Stage
        </Link>
        <nav className="row" style={{ gap: 8 }}>
          {!configured ? (
            <span className="small muted">Configure Firebase to sign in</span>
          ) : !ready ? null : user ? (
            <>
              <Link href="/dashboard" className="btn btn-ghost btn-sm">
                My boards
              </Link>
              <span
                className="row"
                style={{ gap: 8, flexWrap: "nowrap" }}
                title={user.email ?? ""}
              >
                {user.photoURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" className="avatar" referrerPolicy="no-referrer" />
                )}
                <span className="small muted">{user.displayName ?? user.email}</span>
              </span>
              <button className="btn btn-sm" onClick={() => void signOut()}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" role="img" aria-label="Voting Stage">
      <rect width="64" height="64" rx="14" fill="#b4552d" />
      <text
        x="50%"
        y="54%"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="32"
        fontWeight="700"
        fill="#f8ecd2"
      >
        12
      </text>
    </svg>
  );
}
