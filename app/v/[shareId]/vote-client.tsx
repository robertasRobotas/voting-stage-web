"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getOrCreateAnonToken } from "@/lib/anon-token";
import { EUROVISION_POINTS, type EurovisionPoint, type VotingDto } from "@/lib/types";
import { Ballot } from "./ballot";

interface Props {
  shareId: string;
}

export type Allocation = Record<string, EurovisionPoint | undefined>;

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
              Drag points from the tray onto items. Each value (1, 2, 3, 4, 5, 6, 7, 8, 10, 12)
              can be used at most once. Tap a placed point to send it back to the tray.
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

          <Ballot items={voting.items} value={allocation} onChange={setAllocation} />

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

export { EUROVISION_POINTS };
