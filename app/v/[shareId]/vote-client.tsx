"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getOrCreateAnonToken } from "@/lib/anon-token";
import { EUROVISION_POINTS, type EurovisionPoint, type VotingDto } from "@/lib/types";

interface Props {
  shareId: string;
}

type Allocation = Record<string, EurovisionPoint | undefined>;

export function VotePageClient({ shareId }: Props) {
  const { token, user, ready } = useAuth();
  const [voting, setVoting] = useState<VotingDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [allocation, setAllocation] = useState<Allocation>({});
  const [voterName, setVoterName] = useState("");
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Reload board metadata whenever sign-in state settles, so server-side
  // `canVote`/`isOwner` flags reflect the current viewer.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoadError(null);
    api<VotingDto>(`/votings/share/${shareId}`, { token })
      .then((data) => {
        if (!cancelled) setVoting(data);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [shareId, token, ready]);

  // Check if this browser/user has already cast a vote on this board.
  useEffect(() => {
    if (!voting) return;
    let cancelled = false;
    const anonToken = user ? null : getOrCreateAnonToken(shareId);
    api<{ voted: boolean }>(`/votings/${voting.id}/votes/mine`, {
      token,
      anonToken,
    })
      .then((r) => {
        if (!cancelled) setHasVoted(r.voted);
      })
      .catch(() => {
        if (!cancelled) setHasVoted(false);
      });
    return () => {
      cancelled = true;
    };
  }, [voting, token, user, shareId]);

  const assignPoint = useCallback((itemId: string, points: EurovisionPoint | undefined) => {
    setAllocation((prev) => {
      const next: Allocation = { ...prev };
      // Each point value is used at most once → clear it from any other item.
      if (points !== undefined) {
        for (const id of Object.keys(next)) {
          if (next[id] === points) delete next[id];
        }
      }
      if (points === undefined) delete next[itemId];
      else next[itemId] = points;
      return next;
    });
  }, []);

  const usedPoints = useMemo(() => {
    const used = new Set<EurovisionPoint>();
    for (const v of Object.values(allocation)) if (v !== undefined) used.add(v);
    return used;
  }, [allocation]);

  const remainingPoints = useMemo(
    () => EUROVISION_POINTS.filter((p) => !usedPoints.has(p)),
    [usedPoints],
  );

  async function onSubmit() {
    if (!voting) return;
    const allocations = Object.entries(allocation)
      .filter(([, p]) => p !== undefined)
      .map(([itemId, points]) => ({ itemId, points: points! }));
    if (allocations.length === 0) {
      setSubmitError("Assign at least one point value before submitting.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const anonToken = user ? null : getOrCreateAnonToken(shareId);
      await api(`/votings/${voting.id}/votes`, {
        method: "POST",
        token,
        anonToken,
        body: {
          voterName: !user && voterName.trim() ? voterName.trim() : undefined,
          allocations,
        },
      });
      setSubmitted(true);
      setHasVoted(true);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submitting failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) return <div className="error">{loadError}</div>;
  if (!voting) return <p className="muted">Loading…</p>;

  const closed = voting.status === "FINISHED";
  const canVote = !closed && voting.canVote !== false && !hasVoted;
  const needsSignIn = voting.access === "INVITE_ONLY" && !user;

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 820 }}>
      <header className="stack" style={{ gap: 4 }}>
        <div className="row" style={{ gap: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>{voting.title}</h1>
          <StatusBadge status={voting.status} />
          {voting.isOwner && (
            <Link href={`/v/${voting.shareId}/admin`} className="btn btn-ghost small">
              Manage
            </Link>
          )}
        </div>
        {voting.description && <p className="muted">{voting.description}</p>}
      </header>

      {closed && (
        <div className="card">
          <strong>Voting is closed.</strong>{" "}
          <span className="muted">Final results below.</span>
        </div>
      )}

      {!closed && needsSignIn && (
        <div className="card stack" style={{ gap: 8 }}>
          <strong>This board is invite-only.</strong>
          <p className="muted small">Sign in with the email that was invited to cast your vote.</p>
          <Link href={`/login?next=/v/${voting.shareId}`} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
            Sign in
          </Link>
        </div>
      )}

      {!closed && !needsSignIn && hasVoted && !submitted && (
        <div className="success">You&apos;ve already voted on this board. Results will appear when the creator finishes the voting.</div>
      )}

      {submitted && (
        <div className="success">Thanks — your points are in! 🎤</div>
      )}

      {canVote && !needsSignIn && (
        <section className="card stack" style={{ gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Cast your vote</h2>
            <p className="small muted">
              Pick a point value from <strong>{EUROVISION_POINTS.join(", ")}</strong> for each item
              you want to score. Each value can be used at most once. Items left blank get 0.
            </p>
          </div>

          {!user && (
            <div>
              <label className="label" htmlFor="voterName">Your name (optional)</label>
              <input
                id="voterName"
                className="input"
                placeholder="Shown next to your points"
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                maxLength={80}
              />
            </div>
          )}

          <PointsLegend remaining={remainingPoints} />

          <ul className="stack" style={{ listStyle: "none", gap: 10 }}>
            {voting.items.map((item) => (
              <li
                key={item.id}
                className="row"
                style={{
                  gap: 12,
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 10,
                  background: "var(--background)",
                }}
              >
                {item.imageUrl && (
                  // Plain <img> avoids the next/image remotePatterns config dance.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    width={56}
                    height={56}
                    style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }}
                  />
                )}
                <div style={{ flex: 1, fontWeight: 500 }}>{item.title}</div>
                <PointPicker
                  value={allocation[item.id]}
                  used={usedPoints}
                  onChange={(p) => assignPoint(item.id, p)}
                />
              </li>
            ))}
          </ul>

          {submitError && <div className="error">{submitError}</div>}

          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={() => void onSubmit()} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit ballot"}
            </button>
          </div>
        </section>
      )}

      {voting.results && (
        <section className="card stack" style={{ gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>
            Results <span className="muted small">({voting.results.totalVotes} {voting.results.totalVotes === 1 ? "ballot" : "ballots"})</span>
          </h2>
          {voting.results.perItem.length === 0 ? (
            <p className="muted">No votes yet.</p>
          ) : (
            <ol className="stack" style={{ listStyle: "none", gap: 8 }}>
              {voting.results.perItem.map((row, idx) => {
                const item = voting.items.find((i) => i.id === row.itemId);
                return (
                  <li
                    key={row.itemId}
                    className="row"
                    style={{
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: idx === 0 ? "var(--accent)" : "var(--card)",
                      color: idx === 0 ? "#111" : undefined,
                    }}
                  >
                    <strong style={{ width: 28 }}>{idx + 1}.</strong>
                    <span style={{ flex: 1 }}>{item?.title ?? row.itemId}</span>
                    <strong>{row.totalPoints} pts</strong>
                    <span className="small muted">· {row.voteCount} votes</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: VotingDto["status"] }) {
  const map = {
    OPEN: { bg: "#dcfce7", fg: "#166534", label: "Open" },
    FINISHED: { bg: "#e0e7ff", fg: "#3730a3", label: "Finished" },
    DRAFT: { bg: "#f3f4f6", fg: "#374151", label: "Draft" },
  } as const;
  const s = map[status];
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {s.label}
    </span>
  );
}

function PointsLegend({ remaining }: { remaining: readonly EurovisionPoint[] }) {
  return (
    <div className="row" style={{ gap: 6 }}>
      <span className="small muted">Remaining:</span>
      {EUROVISION_POINTS.map((p) => {
        const available = remaining.includes(p);
        return (
          <span
            key={p}
            style={{
              display: "inline-flex",
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              background: available ? (p === 12 ? "var(--accent)" : "var(--card)") : "transparent",
              color: available ? (p === 12 ? "#111" : "var(--foreground)") : "var(--muted)",
              border: "1px solid var(--border)",
              opacity: available ? 1 : 0.4,
              textDecoration: available ? "none" : "line-through",
            }}
          >
            {p}
          </span>
        );
      })}
    </div>
  );
}

function PointPicker({
  value,
  used,
  onChange,
}: {
  value: EurovisionPoint | undefined;
  used: Set<EurovisionPoint>;
  onChange: (p: EurovisionPoint | undefined) => void;
}) {
  return (
    <select
      className="select"
      style={{ width: 96 }}
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? undefined : (Number(v) as EurovisionPoint));
      }}
    >
      <option value="">—</option>
      {EUROVISION_POINTS.map((p) => (
        <option key={p} value={p} disabled={used.has(p) && value !== p}>
          {p}
        </option>
      ))}
    </select>
  );
}
