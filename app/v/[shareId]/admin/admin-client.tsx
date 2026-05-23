"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { VotingAccess, VotingDto, VotingItem } from "@/lib/types";
import { ImagePicker } from "@/app/components/image-picker";
import { Skeleton, SkeletonRow } from "@/app/components/skeleton";

interface Props {
  shareId: string;
}

/** How often to refresh the board while admin is open. Cheap polling beats
 *  spinning up a websocket for a low-traffic voting app. */
const POLL_INTERVAL_MS = 5000;

export function AdminPageClient({ shareId }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const showCreatedFlash = search.get("created") === "1";

  const { token, user, ready } = useAuth();
  const [voting, setVoting] = useState<VotingDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  // Polling is paused while the user is editing settings/items so their input
  // doesn't get clobbered by a refresh in flight.
  const pausePollingRef = useRef(false);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await api<VotingDto>(`/votings/share/${shareId}`, { token });
      setVoting(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [shareId, token]);

  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=/v/${shareId}/admin`);
  }, [ready, user, router, shareId]);

  useEffect(() => {
    if (token) void reload();
  }, [token, reload]);

  // Background polling while the page is open.
  useEffect(() => {
    if (!token) return;
    const id = window.setInterval(() => {
      if (!pausePollingRef.current && document.visibilityState === "visible") {
        void reload();
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [token, reload]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareLink(`${window.location.origin}/v/${shareId}`);
    }
  }, [shareId]);

  async function callOwnerAction(
    method: "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
  ) {
    if (!voting) return;
    setActionError(null);
    try {
      if (method === "DELETE") {
        await api(path, { method, token });
      } else {
        const updated = await api<VotingDto>(path, { method, token, body });
        setVoting(updated);
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
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

  if (loadError) return <div className="error">{loadError}</div>;
  if (!ready || !user || !voting) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <Skeleton height={28} width={320} />
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
        <Link href={`/v/${voting.shareId}`} className="btn">
          View the board
        </Link>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      {showCreatedFlash && (
        <div className="success">
          Voting created. Share the link below to start collecting votes.
        </div>
      )}

      <header className="row" style={{ justifyContent: "space-between", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>{voting.title}</h1>
          <p className="muted small">
            Status: {voting.status.toLowerCase()} ·{" "}
            {voting.access === "LINK" ? "Anyone with link" : "Invite-only"}
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

      {actionError && <div className="error">{actionError}</div>}

      {/* Share section with QR */}
      <section className="card stack" style={{ gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Share</h2>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            readOnly
            value={shareLink}
            onFocus={(e) => e.currentTarget.select()}
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
              borderRadius: 8,
              alignSelf: "flex-start",
            }}
          >
            <QRCode value={shareLink} size={160} />
          </div>
        )}
        <p className="small muted">
          Anyone with this link can open the board. Voting access still depends on the setting
          below.
        </p>
      </section>

      <SettingsSection
        voting={voting}
        onFocusChange={(focused) => (pausePollingRef.current = focused)}
        onSave={async (input) => {
          await callOwnerAction("PATCH", `/votings/${voting.id}/settings`, input);
        }}
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
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>
            Live results{" "}
            <span className="muted small">
              ({voting.results.totalVotes}{" "}
              {voting.results.totalVotes === 1 ? "ballot" : "ballots"})
            </span>
          </h2>
          {voting.results.perItem.length === 0 ? (
            <p className="muted">No votes yet.</p>
          ) : (
            <ol className="stack" style={{ listStyle: "none", gap: 6 }}>
              {voting.results.perItem.map((row, idx) => {
                const item = voting.items.find((i) => i.id === row.itemId);
                return (
                  <li key={row.itemId} className="row" style={{ gap: 8 }}>
                    <strong style={{ width: 28 }}>{idx + 1}.</strong>
                    <span style={{ flex: 1 }}>{item?.title ?? row.itemId}</span>
                    <strong>{row.totalPoints} pts</strong>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}

      {/* Danger zone */}
      <section
        className="card stack"
        style={{ gap: 8, borderColor: "#fca5a5" }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#991b1b" }}>Danger zone</h2>
        <p className="small muted">
          Deleting the board removes it and every ballot. There is no undo.
        </p>
        <button
          className="btn"
          style={{ alignSelf: "flex-start", color: "#991b1b", borderColor: "#fca5a5" }}
          onClick={() => void onDeleteBoard()}
        >
          Delete this board
        </button>
      </section>
    </div>
  );
}

/* ─────────────────── Settings ─────────────────── */

function SettingsSection({
  voting,
  onSave,
  onFocusChange,
}: {
  voting: VotingDto;
  onSave: (input: {
    title: string;
    description?: string;
    access: VotingAccess;
    invitedEmails: string[];
  }) => Promise<void>;
  onFocusChange: (focused: boolean) => void;
}) {
  const [title, setTitle] = useState(voting.title);
  const [description, setDescription] = useState(voting.description ?? "");
  const [access, setAccess] = useState<VotingAccess>(voting.access);
  const [emailsText, setEmailsText] = useState((voting.invitedEmails ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Only resync from server when the user isn't actively editing.
  useEffect(() => {
    if (dirty) return;
    setTitle(voting.title);
    setDescription(voting.description ?? "");
    setAccess(voting.access);
    setEmailsText((voting.invitedEmails ?? []).join(", "));
  }, [voting, dirty]);

  function markDirty(setter: (v: string) => void) {
    return (val: string) => {
      setter(val);
      setDirty(true);
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        access,
        invitedEmails: emailsText
          .split(/[\s,;]+/)
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setDirty(false);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="card stack"
      style={{ gap: 12 }}
      onFocus={() => onFocusChange(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onFocusChange(false);
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Settings</h2>
      <div>
        <label className="label">Title</label>
        <input
          className="input"
          value={title}
          onChange={(e) => markDirty(setTitle)(e.target.value)}
          maxLength={200}
        />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea
          className="textarea"
          value={description}
          onChange={(e) => markDirty(setDescription)(e.target.value)}
          maxLength={2000}
        />
      </div>
      <div>
        <label className="label">Who can vote</label>
        <select
          className="select"
          value={access}
          onChange={(e) => {
            setDirty(true);
            setAccess(e.target.value as VotingAccess);
          }}
        >
          <option value="LINK">Anyone with the link</option>
          <option value="INVITE_ONLY">Invite-only by email</option>
        </select>
      </div>
      {access === "INVITE_ONLY" && (
        <div>
          <label className="label">Invited emails</label>
          <textarea
            className="textarea"
            value={emailsText}
            onChange={(e) => markDirty(setEmailsText)(e.target.value)}
            placeholder="alice@example.com, bob@example.com"
          />
          <p className="small muted" style={{ marginTop: 4 }}>
            Newly added emails are notified by email when you save (if Resend is configured on
            the server).
          </p>
        </div>
      )}
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        {saved && (
          <span className="small" style={{ color: "#16a34a" }}>
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
    <section className="card stack" style={{ gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Items</h2>
      <ul className="stack" style={{ listStyle: "none", gap: 8 }}>
        {voting.items.map((it, idx) => (
          <li
            key={it.id}
            style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: 8,
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
                <div className="row" style={{ gap: 10, flex: 1, minWidth: 0 }}>
                  {it.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  )}
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {it.title}
                  </span>
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <button
                    className="icon-btn"
                    onClick={() => void reorder(it.id, -1)}
                    disabled={idx === 0}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => void reorder(it.id, 1)}
                    disabled={idx === voting.items.length - 1}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    className="btn btn-ghost small"
                    onClick={() => {
                      setEditingId(it.id);
                      onFocusChange(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost small"
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
          imageUrl: imageUrl.trim() || "",
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
    <div className="stack" style={{ gap: 8 }}>
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Item title"
        maxLength={200}
      />
      <ImagePicker value={imageUrl} onChange={setImageUrl} />
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={() => void save()} disabled={saving}>
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
      style={{ gap: 8 }}
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
      <div className="row" style={{ gap: 8 }}>
        <input
          className="input"
          placeholder="New item title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <button type="submit" className="btn" disabled={busy || !title.trim()}>
          + Add
        </button>
      </div>
      <ImagePicker value={imageUrl} onChange={setImageUrl} compact />
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
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>
        Voters <span className="muted small">({voters.length})</span>
      </h2>
      {voters.length === 0 ? (
        <p className="muted">No votes yet.</p>
      ) : (
        <ul className="stack" style={{ listStyle: "none", gap: 6 }}>
          {voters.map((v) => (
            <li
              key={v.voteId}
              className="row"
              style={{
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div className="stack" style={{ gap: 2 }}>
                <span>
                  {v.voterName ??
                    v.voterEmail ??
                    (v.isAnonymous ? "Anonymous voter" : "Voter")}
                </span>
                <span className="small muted">
                  {v.isSignedIn ? "Signed in" : "Anonymous"} ·{" "}
                  {new Date(v.castAt).toLocaleString()}
                </span>
              </div>
              <span className="small muted">
                {v.allocations.reduce((sum, a) => sum + a.points, 0)} pts placed
              </span>
            </li>
          ))}
        </ul>
      )}
      {voting.access === "INVITE_ONLY" && missing.length > 0 && (
        <div>
          <h3 className="label" style={{ marginBottom: 4 }}>
            Still to vote ({missing.length})
          </h3>
          <p className="small muted">{missing.join(", ")}</p>
        </div>
      )}
    </section>
  );
}
