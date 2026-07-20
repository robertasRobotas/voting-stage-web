"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

// Wrapper exists only to provide the Suspense boundary that `useSearchParams`
// requires when the page is prerendered.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <div className="card" style={{ minHeight: 220 }} />
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/dashboard";

  const { signInWithGoogle, user, ready, configured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, router, next]);

  async function onGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      // useEffect handles the redirect once user is set.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "48px auto" }}>
      <div className="card stack" style={{ gap: 20, padding: 28 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 26 }}>Welcome back</h1>
          <p className="muted small" style={{ marginTop: 6 }}>
            Sign in to create voting boards and manage your stage.
          </p>
        </div>

        {!configured && (
          <div className="note note-error">
            Firebase isn&apos;t configured yet. Add <code>NEXT_PUBLIC_FIREBASE_*</code> values
            to <code>.env.local</code> and reload.
          </div>
        )}

        {error && <div className="note note-error">{error}</div>}

        <button
          className="btn"
          onClick={() => void onGoogle()}
          disabled={!configured || busy}
          style={{ padding: "12px 16px", fontSize: 15, fontWeight: 600 }}
        >
          <GoogleIcon />
          {busy ? "Signing in…" : "Continue with Google"}
        </button>

        <p className="small muted" style={{ textAlign: "center" }}>
          By signing in you agree to play nicely with other voters.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.4 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3l5.7-5.7C34.4 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.7l6.3 5.2C40.6 35.8 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
