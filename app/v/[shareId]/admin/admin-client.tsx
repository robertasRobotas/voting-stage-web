"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { VotingAccess, VotingDto } from "@/lib/types";

interface Props {
  shareId: string;
}

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareLink(`${window.location.origin}/v/${shareId}`);
    }
  }, [shareId]);

  async function callOwnerAction(method: "POST" | "PATCH", path: string, body?: unknown) {
    if (!voting) return;
    setActionError(null);
    try {
      const updated = await api<VotingDto>(path, { method, token, body });
      setVoting(updated);
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

  if (loadError) return <div className="error">{loadError}</div>;
  if (!ready || !user || !voting) return <p className="muted">Loading…</p>;

  if (!voting.isOwner) {
    return (
      <div className="card stack" style={{ gap: 8 }}>
        <strong>Only the creator can manage this board.</strong>
        <Link href={`/v/${voting.shareId}`} className="btn">View the board</Link>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 20 }}>
      {showCreatedFlash && (
        <div className="success">Voting created. Share the link below to start collecting votes.</div>
      )}

      <header className="row" style={{ justifyContent: "space-between", gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>{voting.title}</h1>
          <p className="muted small">Status: {voting.status.toLowerCase()} · {voting.access === "LINK" ? "Anyone with link" : "Invite-only"}</p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Link href={`/v/${voting.shareId}`} className="btn btn-ghost">View as voter</Link>
          {voting.status === "OPEN" ? (
            <button className="btn btn-primary" onClick={() => void callOwnerAction("POST", `/votings/${voting.id}/finish`)}>
              Finish voting
            </button>
          ) : (
            <button className="btn" onClick={() => void callOwnerAction("POST", `/votings/${voting.id}/resume`)}>
              Resume voting
            </button>
          )}
        </div>
      </header>

      {actionError && <div className="error">{actionError}</div>}

      <section className="card stack" style={{ gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Share</h2>
        <div className="row" style={{ gap: 8 }}>
          <input className="input" readOnly value={shareLink} onFocus={(e) => e.currentTarget.select()} />
          <button className="btn" onClick={copyShare}>{copied ? "Copied!" : "Copy link"}</button>
        </div>
        <p className="small muted">Anyone with this link can open the board. Voting access still depends on the setting below.</p>
      </section>

      <SettingsSection
        voting={voting}
        onSave={async (input) => {
          await callOwnerAction("PATCH", `/votings/${voting.id}/settings`, input);
        }}
      />

      <section className="card stack" style={{ gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Items</h2>
        <ul className="stack" style={{ listStyle: "none", gap: 8 }}>
          {voting.items.map((it) => (
            <li key={it.id} className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="row" style={{ gap: 10 }}>
                {it.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" width={40} height={40} style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                )}
                <span>{it.title}</span>
              </div>
              <button
                className="btn btn-ghost small"
                onClick={async () => {
                  setActionError(null);
                  try {
                    await api(`/votings/${voting.id}/items/${it.id}`, {
                      method: "DELETE",
                      token,
                    });
                    await reload();
                  } catch (e) {
                    setActionError(e instanceof Error ? e.message : "Could not remove item");
                  }
                }}
                title="Remove item"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <AddItemForm
          onAdd={async (title, imageUrl) => {
            await callOwnerAction("POST", `/votings/${voting.id}/items`, { title, imageUrl });
          }}
        />
      </section>

      {voting.results && (
        <section className="card stack" style={{ gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>
            Live results <span className="muted small">({voting.results.totalVotes} {voting.results.totalVotes === 1 ? "ballot" : "ballots"})</span>
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
    </div>
  );
}

function SettingsSection({
  voting,
  onSave,
}: {
  voting: VotingDto;
  onSave: (input: {
    title: string;
    description?: string;
    access: VotingAccess;
    invitedEmails: string[];
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(voting.title);
  const [description, setDescription] = useState(voting.description ?? "");
  const [access, setAccess] = useState<VotingAccess>(voting.access);
  const [emailsText, setEmailsText] = useState((voting.invitedEmails ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTitle(voting.title);
    setDescription(voting.description ?? "");
    setAccess(voting.access);
    setEmailsText((voting.invitedEmails ?? []).join(", "));
  }, [voting]);

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
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="card stack" style={{ gap: 12 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700 }}>Settings</h2>
      <div>
        <label className="label">Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
      </div>
      <div>
        <label className="label">Who can vote</label>
        <select className="select" value={access} onChange={(e) => setAccess(e.target.value as VotingAccess)}>
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
            onChange={(e) => setEmailsText(e.target.value)}
            placeholder="alice@example.com, bob@example.com"
          />
        </div>
      )}
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        {saved && <span className="small" style={{ color: "#16a34a" }}>Saved</span>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

function AddItemForm({ onAdd }: { onAdd: (title: string, imageUrl?: string) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="row"
      style={{ gap: 8 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setBusy(true);
        try {
          await onAdd(title.trim(), imageUrl.trim() || undefined);
          setTitle("");
          setImageUrl("");
        } finally {
          setBusy(false);
        }
      }}
    >
      <input className="input" placeholder="New item title" value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 1 }} />
      <input className="input" placeholder="Image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ flex: 2 }} />
      <button type="submit" className="btn" disabled={busy || !title.trim()}>Add</button>
    </form>
  );
}
