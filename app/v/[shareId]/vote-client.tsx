"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { getOrCreateAnonToken } from "@/lib/anon-token";
import {
  EUROVISION_POINTS,
  type EurovisionPoint,
  type MyVoteResponse,
  type VotingDto,
} from "@/lib/types";
import { Ballot } from "./ballot";
import { SkeletonRow, Skeleton } from "@/app/components/skeleton";

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
  /** null = haven't checked yet; "fresh" = no prior vote; "resumed" = ballot
   *  prefilled from a previous submission. */
  const [voteState, setVoteState] = useState<"loading" | "fresh" | "resumed" | "submitted">(
    "loading",
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Becomes true after a successful submit, regardless of fresh/resumed. */
  const [confirmation, setConfirmation] = useState<"none" | "saved" | "updated">("none");

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

  // After the board loads, fetch this viewer's prior vote (if any) and prefill
  // the ballot so they can review or edit it.
  useEffect(() => {
    if (!voting) return;
    let cancelled = false;
    const anonToken = user ? null : getOrCreateAnonToken(shareId);
    api<MyVoteResponse>(`/votings/${voting.id}/votes/mine`, {
      token,
      anonToken,
    })
      .then((r) => {
        if (cancelled) return;
        if (r.voted && r.allocations.length > 0) {
          const prefilled: Allocation = {};
          for (const a of r.allocations) prefilled[a.itemId] = a.points;
          setAllocation(prefilled);
          if (r.voterName) setVoterName(r.voterName);
          setVoteState("resumed");
        } else {
          setVoteState("fresh");
        }
      })
      .catch(() => {
        if (!cancelled) setVoteState("fresh");
      });
    return () => {
      cancelled = true;
    };
  }, [voting, token, user, shareId]);

  const onSubmit = useCallback(async () => {
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
      const wasResumed = voteState === "resumed";
      await api(`/votings/${voting.id}/votes`, {
        method: "POST",
        token,
        anonToken,
        body: {
          voterName: !user && voterName.trim() ? voterName.trim() : undefined,
          allocations,
        },
      });
      setVoteState("submitted");
      setConfirmation(wasResumed ? "updated" : "saved");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submitting failed");
    } finally {
      setSubmitting(false);
    }
  }, [voting, allocation, user, voterName, voteState, token, shareId]);

  if (loadError) return <div className="error">{loadError}</div>;

  if (!voting) {
    return (
      <div className="stack" style={{ gap: 16, maxWidth: 820 }}>
        <Skeleton height={28} width={280} />
        <SkeletonRow lines={2} />
        <div className="card stack" style={{ gap: 8 }}>
          <Skeleton height={20} width={160} />
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </div>
      </div>
    );
  }

  const closed = voting.status === "FINISHED";
  const ballotShown =
    !closed &&
    voting.canVote !== false &&
    (voteState === "fresh" || voteState === "resumed" || voteState === "submitted");
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
          <p className="muted small">
            Sign in with the email that was invited to cast your vote.
          </p>
          <Link
            href={`/login?next=/v/${voting.shareId}`}
            className="btn btn-primary"
            style={{ alignSelf: "flex-start" }}
          >
            Sign in
          </Link>
        </div>
      )}

      {voteState === "resumed" && confirmation === "none" && !closed && (
        <div className="card" style={{ borderColor: "var(--primary)" }}>
          <strong>Welcome back.</strong>{" "}
          <span className="muted small">
            Your previous ballot is loaded. Adjust it and submit again to update — or leave it as
            is.
          </span>
        </div>
      )}

      {confirmation === "saved" && <div className="success">Thanks — your points are in! 🎤</div>}
      {confirmation === "updated" && (
        <div className="success">Ballot updated. You can change it again any time before the board closes.</div>
      )}

      {voteState === "loading" && !closed && !needsSignIn && (
        <div className="card">
          <SkeletonRow lines={3} />
        </div>
      )}

      {ballotShown && !needsSignIn && (
        <section className="card stack" style={{ gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>
              {voteState === "resumed" || voteState === "submitted" ? "Your ballot" : "Cast your vote"}
            </h2>
            <p className="small muted">
              Drag points from the tray onto items. Each value (1, 2, 3, 4, 5, 6, 7, 8, 10, 12) can
              be used at most once. Tap a placed point to send it back to the tray.
            </p>
          </div>

          {!user && (
            <div>
              <label className="label" htmlFor="voterName">
                Your name (optional)
              </label>
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
            <button
              className="btn btn-primary"
              onClick={() => void onSubmit()}
              disabled={submitting}
            >
              {submitting
                ? "Submitting…"
                : voteState === "resumed" || voteState === "submitted"
                  ? "Update my ballot"
                  : "Submit ballot"}
            </button>
          </div>
        </section>
      )}

      {voting.results && (
        <ResultsSection voting={voting} />
      )}
    </div>
  );
}

function ResultsSection({ voting }: { voting: VotingDto }) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const results = voting.results!;
  return (
    <section className="card stack" style={{ gap: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700 }}>
        Results{" "}
        <span className="muted small">
          ({results.totalVotes} {results.totalVotes === 1 ? "ballot" : "ballots"})
        </span>
      </h2>
      {results.perItem.length === 0 ? (
        <p className="muted">No votes yet.</p>
      ) : (
        <ol className="stack" style={{ listStyle: "none", gap: 8 }}>
          {results.perItem.map((row, idx) => {
            const item = voting.items.find((i) => i.id === row.itemId);
            const expanded = expandedItemId === row.itemId;
            return (
              <li
                key={row.itemId}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: idx === 0 ? "var(--accent)" : "var(--card)",
                  color: idx === 0 ? "#111" : undefined,
                }}
              >
                <button
                  type="button"
                  className="row"
                  onClick={() =>
                    setExpandedItemId((cur) => (cur === row.itemId ? null : row.itemId))
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                    color: "inherit",
                    padding: 0,
                    gap: 12,
                  }}
                >
                  <strong style={{ width: 28 }}>{idx + 1}.</strong>
                  <span style={{ flex: 1, textAlign: "left" }}>
                    {item?.title ?? row.itemId}
                  </span>
                  <strong>{row.totalPoints} pts</strong>
                  <span className="small muted">· {row.voteCount} votes</span>
                  <span aria-hidden style={{ marginLeft: 6 }}>
                    {expanded ? "▾" : "▸"}
                  </span>
                </button>
                {expanded && (
                  <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {Object.entries(row.pointsBreakdown)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([pts, count]) => (
                        <span
                          key={pts}
                          className="small"
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "rgba(0,0,0,0.08)",
                          }}
                        >
                          {count}× {pts}pt
                        </span>
                      ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {voting.voters && voting.voters.length > 0 && (
        <details>
          <summary className="small muted" style={{ cursor: "pointer" }}>
            See per-voter ballots ({voting.voters.length})
          </summary>
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            {voting.voters.map((v) => (
              <div
                key={v.voteId}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 8,
                  background: "var(--background)",
                }}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600 }}>
                    {v.voterName ?? v.voterEmail ?? (v.isAnonymous ? "Anonymous" : "Voter")}
                  </span>
                  <span className="small muted">
                    {new Date(v.castAt).toLocaleString()}
                  </span>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {v.allocations
                    .slice()
                    .sort((a, b) => b.points - a.points)
                    .map((a) => {
                      const item = voting.items.find((i) => i.id === a.itemId);
                      return (
                        <span
                          key={a.itemId}
                          className="small"
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <strong>{a.points}</strong> · {item?.title ?? a.itemId}
                        </span>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
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
