"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { VotingDto } from "@/lib/types";
import { Skeleton } from "@/app/components/skeleton";
import { StatusBadge } from "@/app/components/status-badge";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, ready } = useAuth();
  const [items, setItems] = useState<VotingDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/dashboard");
  }, [ready, user, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api<VotingDto[]>("/votings", { token })
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load boards");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!ready || !user) {
    return <p className="muted">Loading…</p>;
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="page-title">My voting boards</h1>
        <Link href="/votings/new" className="btn btn-primary">
          New voting
        </Link>
      </div>

      {error && <div className="note note-error">{error}</div>}

      {items === null && !error && (
        <div className="stack" style={{ gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card row" style={{ padding: 16, justifyContent: "space-between" }}>
              <div className="stack" style={{ gap: 6, flex: 1 }}>
                <Skeleton height={18} width="40%" />
                <Skeleton height={12} width="60%" />
              </div>
              <Skeleton height={36} width={120} radius={8} />
            </div>
          ))}
        </div>
      )}

      {items && items.length === 0 && (
        <div className="card stack" style={{ alignItems: "center", gap: 12, padding: 40, textAlign: "center" }}>
          <h2 className="section-title">Nothing on stage yet</h2>
          <p className="muted" style={{ maxWidth: 380 }}>
            Create a board, add the contenders, and share the link — your voters do the rest.
          </p>
          <Link href="/votings/new" className="btn btn-primary">
            Create your first voting
          </Link>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="stack" style={{ listStyle: "none", gap: 10 }}>
          {items.map((v) => (
            <li key={v.id} className="card" style={{ padding: 16 }}>
              <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                <div className="stack" style={{ gap: 4, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Link
                      href={`/v/${v.shareId}/admin`}
                      style={{ fontWeight: 600, color: "var(--ink)", fontSize: 16 }}
                    >
                      {v.title}
                    </Link>
                    <StatusBadge status={v.status} />
                  </div>
                  <div className="small muted">
                    {v.items.length} {v.items.length === 1 ? "item" : "items"} ·{" "}
                    {v.access === "LINK" ? "anyone with the link" : "invite-only"} · created{" "}
                    {new Date(v.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <Link href={`/v/${v.shareId}`} className="btn btn-ghost btn-sm">
                    Open
                  </Link>
                  <Link href={`/v/${v.shareId}/admin`} className="btn btn-sm">
                    Manage
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
