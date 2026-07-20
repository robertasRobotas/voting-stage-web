"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { parseEmailList } from "@/lib/emails";
import type { VotingAccess, VotingDto, VotingItem } from "@/lib/types";
import { ImagePicker } from "@/app/components/image-picker";
import { Skeleton, SkeletonRow } from "@/app/components/skeleton";
import { StatusBadge } from "@/app/components/status-badge";

interface Props {
  shareId: string;
}

/** How often to refresh the board while admin is open. Cheap polling beats
 *  spinning up a websocket for a low-traffic voting app. */
const POLL_INTERVAL_MS = 5000;

// window.location.origin never changes, so subscribing is a no-op; the store
// exists purely to read a browser-only value without a hydration mismatch.
const noopSubscribe = () => () => {};
function useOrigin(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
}

export function AdminPageClient({ shareId }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const showCreatedFlash = search.get("created") === "1";

  const { token, user, ready } = useAuth();
  const [voting, setVoting] = useState<VotingDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const origin = useOrigin();
  const shareLink = origin ? `${origin}/v/${shareId}` : "";

  // Polling is paused while the user is editing settings/items so their input
  // doesn't get clobbered by a refresh in flight.
  const pausePollingRef = useRef(false);

  const reload = useCallback(async () => {
    try {
      const data = await api<VotingDto>(`/votings/share/${shareId}`, { token });
      setVoting(data);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [shareId, token]);

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=/v/${shareId}/admin`);
  }, [ready, user, router, shareId]);

  // Initial load (next tick) plus background polling while the page is open.
  useEffect(() => {
    if (!token) return;
    const initial = window.setTimeout(() => void reload(), 0);
    const id = window.setInterval(() => {
      if (!pausePollingRef.current && document.visibilityState === "visible") {
        void reload();
      }
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, [token, reload]);

  /**
   * Run an owner mutation, then re-fetch the full board (the share endpoint is
   * the only one that returns results/voters, so using the mutation response
   * directly would blank those sections until the next poll).
   * Returns whether the action succeeded so forms can keep their dirty state.
   */
  async function callOwnerAction(
    method: "POST" | "PATCH",
    path: string,
    body?: unknown,
  ): Promise<boolean> {
    if (!voting) return false;
    setActionError(null);
    try {
      await api(path, { method, token, body });
      await reload();
      return true;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
      return false;
    }
  }

  function copyShare() {
    if (!shareLink) return;
    void navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  async function onDeleteBoard() {
    if (!voting) return;
    if (
      !window.confirm(
        `Delete "${voting.title}"?\n\nThis removes the board and all ${voting.results?.totalVotes ?? 0} votes that have been cast on it. This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await api(`/votings/${voting.id}`, { method: "DELETE", token });
      router.replace("/dashboard");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not delete");
    }
  }

  if (loadError) return <div className="note note-error">{loadError}</div>;
  if (!ready || !user || !voting) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <Skeleton height={30} width={320} />
        <Skeleton height={16} width={200} />
        <div className="card stack" style={{ gap: 8 }}>
          <SkeletonRow lines={4} />
        </div>
      </div>
    );
  }

  if (!voting.isOwner) {
    return (
      <div className="card stack" style={{ gap: 8 }}>
        <strong>Only the creator can manage this board.</strong>
        <Link href={`/v/${voting.shareId}`} className="btn" style={{ alignSelf: "flex-start" }}>
          View the board
        </Link>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      {showCreatedFlash && (
        <div className="note note-success">
          Voting created. Share the link below to start collecting votes.
        </div>
      )}

      <header className="row" style={{ justifyContent: "space-between", gap: 8 }}>
        <div className="stack" style={{ gap: 6 }}>
          <div className="row" style={{ gap: 10 }}>
            <h1 className="page-title">{voting.title}</h1>
            <StatusBadge status={voting.status} />
          </div>
          <p className="muted small">
            {voting.access === "LINK" ? "Anyone with the link can vote" : "Invite-only board"}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link href={`/v/${voting.shareId}`} className="btn btn-ghost">
            View as voter
          </Link>
          {voting.status === "OPEN" ? (
            <button
              className="btn btn-primary"
              onClick={() => void callOwnerAction("POST", `/votings/${voting.id}/finish`)}
            >
              Finish voting
            </button>
          ) : (
            <button
              className="btn"
              onClick={() => void callOwnerAction("POST", `/votings/${voting.id}/resume`)}
            >
              Resume voting
            </button>
          )}
        </div>
      </header>

      {actionError && <div className="note note-error">{actionError}</div>}

      {/* Share section with QR */}
      <section className="card stack" style={{ gap: 12 }}>
        <h2 className="section-title">Share</h2>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            readOnly
            value={shareLink}
            onFocus={(e) => e.currentTarget.select()}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button className="btn" onClick={copyShare}>
            {copied ? "Copied!" : "Copy link"}
          </button>
          <button className="btn btn-ghost" onClick={() => setShowQr((v) => !v)}>
            {showQr ? "Hide QR" : "Show QR"}
          </button>
        </div>
        {showQr && shareLink && (
          <div
            style={{
              background: "white",
              padding: 12,
              borderRadius: 10,
              alignSelf: "flex-start",
              border: "1px solid var(--border)",
            }}
          >
            <QRCode value={shareLink} size={160} />
          </div>
        )}
        <p className="hint">
          Anyone with this link can open the board. Voting access still depends on the setting
          below.
        </p>
      </section>

      <SettingsSection
        voting={voting}
        onFocusChange={(focused) => (pausePollingRef.current = focused)}
        onSave={(input) => callOwnerAction("PATCH", `/votings/${voting.id}/settings`, input)}
      />

      <ItemsSection
        voting={voting}
        token={token}
        onFocusChange={(focused) => (pausePollingRef.current = focused)}
        onMutated={() => void reload()}
        onError={(e) => setActionError(e)}
      />

      <VotersSection voting={voting} />

      {voting.results && (
        <section className="card stack" style={{ gap: 12 }}>
          <h2 className="section-title">
            Live results{" "}
            <span className="muted small" style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}>
              ({voting.results.totalVotes}{" "}
              {voting.results.totalVotes === 1 ? "ballot" : "ballots"})
            </span>
          </h2>
          {voting.results.perItem.length === 0 ? (
            <p className="muted">No votes yet.</p>
          ) : (
            <LiveResults voting={voting} />
          )}
        </section>
      )}

      {/* Danger zone */}
      <section className="card stack" style={{ gap: 8, borderColor: "var(--red-border)" }}>
        <h2 className="section-title" style={{ color: "var(--red)" }}>
          Danger zone
        </h2>
        <p className="small muted">
          Deleting the board removes it and every ballot. There is no undo.
        </p>
        <button
          className="btn btn-danger"
          style={{ alignSelf: "flex-start" }}
          onClick={() => void onDeleteBoard()}
        >
          Delete this board
        </button>
      </section>
    </div>
  );
}

function LiveResults({ voting }: { voting: VotingDto }) {
  const results = voting.results!;
  const maxPoints = Math.max(1, ...results.perItem.map((r) => r.totalPoints));
  return (
    <ol className="stack" style={{ listStyle: "none", gap: 8 }}>
      {results.perItem.map((row, idx) => {
        const item = voting.items.find((i) => i.id === row.itemId);
        return (
          <li
            key={row.itemId}
            className={`result-row${idx === 0 ? " is-leader" : ""}`}
            style={{ "--bar": `${(row.totalPoints / maxPoints) * 100}%` } as React.CSSProperties}
          >
            <div className="row" style={{ gap: 12, flexWrap: "nowrap" }}>
              <span className="result-rank">{idx + 1}</span>
              <span style={{ flex: 1, fontWeight: idx === 0 ? 600 : 500 }}>
                {item?.title ?? "Removed item"}
              </span>
              <strong style={{ fontVariantNumeric: "tabular-nums" }}>{row.totalPoints} pts</strong>
              <span className="small muted">
                {row.voteCount} {row.voteCount === 1 ? "vote" : "votes"}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ─────────────────── Settings ─────────────────── */

interface SettingsDraft {
  title: string;
  description: string;
  access: VotingAccess;
  emailsText: string;
}

function draftFromVoting(voting: VotingDto): SettingsDraft {
  return {
    title: voting.title,
    description: voting.description ?? "",
    access: voting.access,
    emailsText: (voting.invitedEmails ?? []).join(", "),
  };
}

function SettingsSection({
  voting,
  onSave,
  onFocusChange,
}: {
  voting: VotingDto;
  onSave: (input: {
    title: string;
    description: string;
    access: VotingAccess;
    invitedEmails: string[];
  }) => Promise<boolean>;
  onFocusChange: (focused: boolean) => void;
}) {
  // null = pristine: the form mirrors server state, so background polling can
  // refresh it freely. Non-null = unsaved edits that must not be clobbered.
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const view = draft ?? draftFromVoting(voting);
  const dirty = draft !== null;

  function edit(patch: Partial<SettingsDraft>) {
    setDraft({ ...view, ...patch });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!view.title.trim()) {
      setLocalError("The board needs a title.");
      return;
    }
    const { emails, invalid } = parseEmailList(view.emailsText);
    if (view.access === "INVITE_ONLY") {
      if (invalid.length > 0) {
        setLocalError(`These don't look like email addresses: ${invalid.join(", ")}`);
        return;
      }
      if (emails.length === 0) {
        setLocalError("Invite at least one email, or switch to anyone-with-link.");
        return;
      }
    }

    setSaving(true);
    setSaved(false);
    try {
      const ok = await onSave({
        title: view.title.trim(),
        // Empty string clears the description server-side.
        description: view.description.trim(),
        access: view.access,
        invitedEmails: emails,
      });
      if (ok) {
        // onSave reloads the board before resolving, so dropping the draft
        // reveals the freshly saved server state.
        setDraft(null);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="card stack"
      style={{ gap: 14 }}
      onFocus={() => onFocusChange(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onFocusChange(false);
      }}
    >
      <h2 className="section-title">Settings</h2>
      <div>
        <label className="label" htmlFor="settings-title">Title</label>
        <input
          id="settings-title"
          className="input"
          value={view.title}
          onChange={(e) => edit({ title: e.target.value })}
          maxLength={200}
        />
      </div>
      <div>
        <label className="label" htmlFor="settings-description">Description</label>
        <textarea
          id="settings-description"
          className="textarea"
          value={view.description}
          onChange={(e) => edit({ description: e.target.value })}
          maxLength={2000}
        />
      </div>
      <div>
        <label className="label" htmlFor="settings-access">Who can vote</label>
        <select
          id="settings-access"
          className="select"
          value={view.access}
          onChange={(e) => edit({ access: e.target.value as VotingAccess })}
        >
          <option value="LINK">Anyone with the link</option>
          <option value="INVITE_ONLY">Invite-only by email</option>
        </select>
      </div>
      {view.access === "INVITE_ONLY" && (
        <div>
          <label className="label" htmlFor="settings-emails">Invited emails</label>
          <textarea
            id="settings-emails"
            className="textarea"
            style={{ minHeight: 64 }}
            value={view.emailsText}
            onChange={(e) => edit({ emailsText: e.target.value })}
            placeholder="alice@example.com, bob@example.com"
          />
          <p className="hint">
            Newly added emails get an invitation email when you save (if email sending is
            configured on the server).
          </p>
        </div>
      )}
      {localError && <div className="note note-error">{localError}</div>}
      <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
        {saved && (
          <span className="small" style={{ color: "var(--green)" }}>
            Saved
          </span>
        )}
        <button type="submit" className="btn btn-primary" disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────── Items ─────────────────── */

function ItemsSection({
  voting,
  token,
  onMutated,
  onError,
  onFocusChange,
}: {
  voting: VotingDto;
  token: string | null;
  onMutated: () => void;
  onError: (e: string) => void;
  onFocusChange: (focused: boolean) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  async function reorder(itemId: string, direction: -1 | 1) {
    const ids = voting.items.map((i) => i.id);
    const idx = ids.indexOf(itemId);
    const target = idx + direction;
    if (target < 0 || target >= ids.length) return;
    const next = [...ids];
    [next[idx], next[target]] = [next[target], next[idx]];
    try {
      await api(`/votings/${voting.id}/items/reorder`, {
        method: "POST",
        token,
        body: { itemIds: next },
      });
      onMutated();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Reorder failed");
    }
  }

  async function deleteItem(item: VotingItem) {
    if (!window.confirm(`Remove "${item.title}"?`)) return;
    try {
      await api(`/votings/${voting.id}/items/${item.id}`, { method: "DELETE", token });
      onMutated();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not remove");
    }
  }

  return (
    <section className="card stack" style={{ gap: 14 }}>
      <h2 className="section-title">Items</h2>
      <ul className="stack" style={{ listStyle: "none", gap: 0 }}>
        {voting.items.map((it, idx) => (
          <li
            key={it.id}
            style={{
              borderTop: idx === 0 ? "none" : "1px solid var(--border)",
              padding: "10px 0",
            }}
          >
            {editingId === it.id ? (
              <EditItem
                item={it}
                onCancel={() => {
                  setEditingId(null);
                  onFocusChange(false);
                }}
                onSaved={() => {
                  setEditingId(null);
                  onFocusChange(false);
                  onMutated();
                }}
                votingId={voting.id}
                token={token}
                onError={onError}
              />
            ) : (
              <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                <div className="row" style={{ gap: 10, flex: 1, minWidth: 0, flexWrap: "nowrap" }}>
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="item-thumb"
                      style={{ width: 40, height: 40 }}
                    />
                  ) : (
                    <span
                      className="item-thumb"
                      style={{ width: 40, height: 40, display: "inline-block" }}
                      aria-hidden
                    />
                  )}
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontWeight: 500,
                    }}
                  >
                    {it.title}
                  </span>
                </div>
                <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                  <button
                    className="icon-btn"
                    onClick={() => void reorder(it.id, -1)}
                    disabled={idx === 0}
                    title="Move up"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => void reorder(it.id, 1)}
                    disabled={idx === voting.items.length - 1}
                    title="Move down"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingId(it.id);
                      onFocusChange(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => void deleteItem(it)}
                    title="Remove item"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <hr className="divider" />
      <AddItemForm
        votingId={voting.id}
        token={token}
        onMutated={onMutated}
        onError={onError}
        onFocusChange={onFocusChange}
      />
    </section>
  );
}

function EditItem({
  item,
  votingId,
  token,
  onSaved,
  onCancel,
  onError,
}: {
  item: VotingItem;
  votingId: string;
  token: string | null;
  onSaved: () => void;
  onCancel: () => void;
  onError: (e: string) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      onError("Title cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await api(`/votings/${votingId}/items/${item.id}`, {
        method: "PATCH",
        token,
        body: {
          title: title.trim(),
          // Empty string clears the image server-side.
          imageUrl: imageUrl.trim(),
        },
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 10, padding: "4px 0" }}>
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Item title"
        maxLength={200}
      />
      <ImagePicker value={imageUrl} onChange={setImageUrl} />
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function AddItemForm({
  votingId,
  token,
  onMutated,
  onError,
  onFocusChange,
}: {
  votingId: string;
  token: string | null;
  onMutated: () => void;
  onError: (e: string) => void;
  onFocusChange: (focused: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="stack"
      style={{ gap: 10 }}
      onFocus={() => onFocusChange(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onFocusChange(false);
      }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setBusy(true);
        try {
          await api(`/votings/${votingId}/items`, {
            method: "POST",
            token,
            body: { title: title.trim(), imageUrl: imageUrl.trim() || undefined },
          });
          setTitle("");
          setImageUrl("");
          onMutated();
        } catch (e) {
          onError(e instanceof Error ? e.message : "Add failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <span className="label" style={{ marginBottom: 0 }}>Add an item</span>
      <div className="row" style={{ gap: 8 }}>
        <input
          className="input"
          placeholder="New item title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <button type="submit" className="btn" disabled={busy || !title.trim()}>
          {busy ? "Adding…" : "Add item"}
        </button>
      </div>
      <ImagePicker value={imageUrl} onChange={setImageUrl} />
    </form>
  );
}

/* ─────────────────── Voters ─────────────────── */

function VotersSection({ voting }: { voting: VotingDto }) {
  const voters = voting.voters ?? [];
  const invitedEmails = (voting.invitedEmails ?? []).map((e) => e.toLowerCase());
  const votedEmails = new Set(
    voters.map((v) => v.voterEmail?.toLowerCase()).filter((e): e is string => !!e),
  );
  const missing =
    voting.access === "INVITE_ONLY"
      ? invitedEmails.filter((e) => !votedEmails.has(e))
      : [];

  return (
    <section className="card stack" style={{ gap: 10 }}>
      <h2 className="section-title">
        Voters{" "}
        <span className="muted small" style={{ fontFamily: "var(--font-body)", fontWeight: 400 }}>
          ({voters.length})
        </span>
      </h2>
      {voters.length === 0 ? (
        <p className="muted">No votes yet.</p>
      ) : (
        <ul className="stack" style={{ listStyle: "none", gap: 0 }}>
          {voters.map((v) => (
            <li key={v.voteId} className="voter-row">
              <div className="stack" style={{ gap: 2 }}>
                <span style={{ fontWeight: 500 }}>
                  {v.voterName ?? v.voterEmail ?? (v.isAnonymous ? "Anonymous voter" : "Voter")}
                </span>
                <span className="small muted">
                  {v.isSignedIn ? "Signed in" : "Anonymous"} ·{" "}
                  {new Date(v.castAt).toLocaleString()}
                </span>
              </div>
              <span className="small muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                {v.allocations.reduce((sum, a) => sum + a.points, 0)} pts placed
              </span>
            </li>
          ))}
        </ul>
      )}
      {voting.access === "INVITE_ONLY" && missing.length > 0 && (
        <div className="note">
          <strong className="small">Still to vote ({missing.length}):</strong>{" "}
          <span className="small muted">{missing.join(", ")}</span>
        </div>
      )}
    </section>
  );
}
