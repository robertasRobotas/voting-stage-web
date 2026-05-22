"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onIdTokenChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { firebaseConfigured, getFirebase, googleProvider } from "./firebase";

interface AuthCtx {
  ready: boolean;
  configured: boolean;
  user: FirebaseUser | null;
  /** Cached ID token. Refresh happens via onIdTokenChanged automatically. */
  token: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(!firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const { auth } = getFirebase();
    const unsub = onIdTokenChanged(auth, async (u) => {
      setUser(u);
      setToken(u ? await u.getIdToken() : null);
      setReady(true);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { auth } = getFirebase();
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOut = useCallback(async () => {
    if (!firebaseConfigured) return;
    const { auth } = getFirebase();
    await fbSignOut(auth);
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      ready,
      configured: firebaseConfigured,
      user,
      token,
      signInWithGoogle,
      signOut,
    }),
    [ready, user, token, signInWithGoogle, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
