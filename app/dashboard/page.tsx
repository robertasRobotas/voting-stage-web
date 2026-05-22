"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { VotingDto } from "@/lib/types";

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
    setError(null);
    api<VotingDto[]>("/votings", { token })
      .then((data) => {
        if (!cancelled) setItems(data);
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
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>My voting boards</h1>
        <Link href="/votings/new" className="btn btn-primary">
          + New voting
        </Link>
      </div>

      {error && <div className="error">{error}</div>}

      {items === null && !error && <p className="muted">Loading boards…</p>}

      {items && items.length === 0 && (
        <div className="card stack" style={{ alignItems: "flex-start", gap: 12 }}>
          <p>You haven&apos;t created any boards yet.</p>
          <Link href="/votings/new" className="btn btn-primary">
            Create your first voting
          </Link>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="stack" style={{ listStyle: "none", gap: 12 }}>
          {items.map((v) => (
            <li key={v.id} className="card" style={{ padding: 16 }}>
              <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{v.title}</div>
                  <div className="small muted">
                    {v.items.length} items · {v.status.toLowerCase()} · {v.access === "LINK" ? "anyone with link" : "invite-only"}
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <Link href={`/v/${v.shareId}`} className="btn btn-ghost">Open</Link>
                  <Link href={`/v/${v.shareId}/admin`} className="btn">Manage</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
