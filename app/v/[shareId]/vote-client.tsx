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
import { StatusBadge } from "@/app/components/status-badge";

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
    api<VotingDto>(`/votings/share/${shareId}`, { token })
      .then((data) => {
        if (!cancelled) {
          setVoting(data);
          setLoadError(null);
        }
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
    const knownItemIds = new Set(voting.items.map((i) => i.id));
    api<MyVoteResponse>(`/votings/${voting.id}/votes/mine`, {
      token,
      anonToken,
    })
      .then((r) => {
        if (cancelled) return;
        if (r.voted && r.allocations.length > 0) {
          const prefilled: Allocation = {};
          // Skip allocations pointing at items the owner has since removed,
          // otherwise those points would be "spent" on an invisible item.
          for (const a of r.allocations) {
            if (knownItemIds.has(a.itemId)) prefilled[a.itemId] = a.points;
          }
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
      // Anything after the first successful submit is an update.
      const isUpdate = voteState !== "fresh";
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
      setConfirmation(isUpdate ? "updated" : "saved");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submitting failed");
    } finally {
      setSubmitting(false);
    }
  }, [voting, allocation, user, voterName, voteState, token, shareId]);

  if (loadError) return <div className="note note-error">{loadError}</div>;

  if (!voting) {
    return (
      <div className="stack" style={{ gap: 16, maxWidth: 780 }}>
        <Skeleton height={30} width={280} />
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
  const notInvited =
    !closed && voting.access === "INVITE_ONLY" && !!user && voting.canVote === false;

  return (
    <div className="stack" style={{ gap: 20, maxWidth: 780 }}>
      <header className="stack" style={{ gap: 6 }}>
        <div className="row" style={{ gap: 10 }}>
          <h1 className="page-title">{voting.title}</h1>
          <StatusBadge status={voting.status} />
          {voting.isOwner && (
            <Link href={`/v/${voting.shareId}/admin`} className="btn btn-ghost btn-sm">
              Manage
            </Link>
          )}
        </div>
        {voting.description && <p className="muted">{voting.description}</p>}
      </header>

      {closed && (
        <div className="note note-gold">
          <strong>Voting is closed.</strong> Final results are below.
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

      {notInvited && (
        <div className="card stack" style={{ gap: 6 }}>
          <strong>This board is invite-only.</strong>
          <p className="muted small">
            You&apos;re signed in as {user?.email}, but that address isn&apos;t on the invite
            list. Ask the board&apos;s creator to add it, or sign in with the invited account.
          </p>
        </div>
      )}

      {voteState === "resumed" && confirmation === "none" && !closed && (
        <div className="note">
          <strong>Welcome back.</strong>{" "}
          <span className="muted small">
            Your previous ballot is loaded — adjust it and submit again to update, or leave it
            as is.
          </span>
        </div>
      )}

      {confirmation === "saved" && (
        <div className="note note-success">Thanks — your points are in!</div>
      )}
      {confirmation === "updated" && (
        <div className="note note-success">
          Ballot updated. You can change it again any time before the board closes.
        </div>
      )}

      {voteState === "loading" && !closed && !needsSignIn && !notInvited && (
        <div className="card">
          <SkeletonRow lines={3} />
        </div>
      )}

      {ballotShown && !needsSignIn && (
        <section className="card stack" style={{ gap: 16 }}>
          <div>
            <h2 className="section-title">
              {voteState === "resumed" || voteState === "submitted"
                ? "Your ballot"
                : "Cast your vote"}
            </h2>
            <p className="small muted" style={{ marginTop: 4 }}>
              Drag points from the tray onto items — each value can be used once. Tap a placed
              point to send it back.
            </p>
          </div>

          {!user && (
            <div>
              <label className="label" htmlFor="voterName">
                Your name <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>
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

          {submitError && <div className="note note-error">{submitError}</div>}

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

      {voting.results && <ResultsSection voting={voting} />}
    </div>
  );
}

function ResultsSection({ voting }: { voting: VotingDto }) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const results = voting.results!;
  const maxPoints = Math.max(1, ...results.perItem.map((r) => r.totalPoints));

  return (
    <section className="card stack" style={{ gap: 12 }}>
      <h2 className="section-title">
        Results{" "}
        <span className="muted small" style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}>
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
                className={`result-row${idx === 0 ? " is-leader" : ""}`}
                style={{ "--bar": `${(row.totalPoints / maxPoints) * 100}%` } as React.CSSProperties}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedItemId((cur) => (cur === row.itemId ? null : row.itemId))
                  }
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                    color: "inherit",
                    font: "inherit",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "left",
                  }}
                  aria-expanded={expanded}
                >
                  <span className="result-rank">{idx + 1}</span>
                  {item?.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      width={36}
                      height={36}
                      className="item-thumb"
                      style={{ width: 36, height: 36 }}
                    />
                  )}
                  <span style={{ flex: 1, fontWeight: idx === 0 ? 600 : 500 }}>
                    {item?.title ?? "Removed item"}
                  </span>
                  <strong style={{ fontVariantNumeric: "tabular-nums" }}>
                    {row.totalPoints} pts
                  </strong>
                  <span className="small muted">
                    {row.voteCount} {row.voteCount === 1 ? "vote" : "votes"}
                  </span>
                  <span aria-hidden className="muted small">
                    {expanded ? "▾" : "▸"}
                  </span>
                </button>
                {expanded && (
                  <div className="row" style={{ gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {Object.entries(row.pointsBreakdown)
                      .sort(([a], [b]) => Number(b) - Number(a))
                      .map(([pts, count]) => (
                        <span key={pts} className="tag">
                          {count}× {pts} pt
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
          <summary>See per-voter ballots ({voting.voters.length})</summary>
          <div className="stack" style={{ gap: 8, marginTop: 10 }}>
            {voting.voters.map((v) => (
              <div
                key={v.voteId}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 10,
                }}
              >
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600 }}>
                    {v.voterName ?? v.voterEmail ?? (v.isAnonymous ? "Anonymous" : "Voter")}
                  </span>
                  <span className="small muted">{new Date(v.castAt).toLocaleString()}</span>
                </div>
                <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {v.allocations
                    .slice()
                    .sort((a, b) => b.points - a.points)
                    .map((a) => {
                      const item = voting.items.find((i) => i.id === a.itemId);
                      return (
                        <span key={a.itemId} className="tag">
                          <strong>{a.points}</strong>&thinsp;·&thinsp;{item?.title ?? "removed"}
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

export { EUROVISION_POINTS };
