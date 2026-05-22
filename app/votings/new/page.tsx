"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { VotingAccess, VotingDto } from "@/lib/types";

interface DraftItem {
  key: string;
  title: string;
  imageUrl: string;
}

function emptyItem(): DraftItem {
  return { key: Math.random().toString(36).slice(2), title: "", imageUrl: "" };
}

export default function NewVotingPage() {
  const router = useRouter();
  const { user, token, ready } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [access, setAccess] = useState<VotingAccess>("LINK");
  const [emailsText, setEmailsText] = useState("");
  const [items, setItems] = useState<DraftItem[]>([emptyItem(), emptyItem()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/votings/new");
  }, [ready, user, router]);

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }
  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanedItems = items
      .map((it) => ({ title: it.title.trim(), imageUrl: it.imageUrl.trim() || undefined }))
      .filter((it) => it.title.length > 0);

    if (cleanedItems.length < 2) {
      setError("Add at least two items.");
      return;
    }

    const invitedEmails =
      access === "INVITE_ONLY"
        ? emailsText
            .split(/[\s,;]+/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean)
        : [];

    if (access === "INVITE_ONLY" && invitedEmails.length === 0) {
      setError("Invite at least one email, or switch to anyone-with-link.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await api<VotingDto>("/votings", {
        method: "POST",
        token,
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          access,
          invitedEmails,
          items: cleanedItems,
        },
      });
      router.push(`/v/${created.shareId}/admin?created=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the voting");
      setSubmitting(false);
    }
  }

  if (!ready || !user) return <p className="muted">Loading…</p>;

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 20, maxWidth: 720 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>New voting board</h1>

      {error && <div className="error">{error}</div>}

      <div>
        <label className="label" htmlFor="title">Title</label>
        <input
          id="title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Best movie of 2025"
          required
          maxLength={200}
        />
      </div>

      <div>
        <label className="label" htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell voters what they're choosing between."
          maxLength={2000}
        />
      </div>

      <fieldset className="card stack" style={{ gap: 12 }}>
        <legend style={{ padding: "0 6px", fontWeight: 600 }}>Who can vote?</legend>
        <label className="row" style={{ gap: 8 }}>
          <input
            type="radio"
            name="access"
            value="LINK"
            checked={access === "LINK"}
            onChange={() => setAccess("LINK")}
          />
          <span><strong>Anyone with the link.</strong> <span className="muted small">Anonymous voters get a per-browser token so they can&apos;t vote twice.</span></span>
        </label>
        <label className="row" style={{ gap: 8, alignItems: "flex-start" }}>
          <input
            type="radio"
            name="access"
            value="INVITE_ONLY"
            checked={access === "INVITE_ONLY"}
            onChange={() => setAccess("INVITE_ONLY")}
            style={{ marginTop: 4 }}
          />
          <span style={{ flex: 1 }}>
            <strong>Invite-only by email.</strong>
            <span className="muted small"> Listed emails must sign in to vote.</span>
            {access === "INVITE_ONLY" && (
              <textarea
                className="textarea"
                style={{ marginTop: 8 }}
                placeholder="alice@example.com, bob@example.com"
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
              />
            )}
          </span>
        </label>
        <p className="small muted">You can change this later in board settings.</p>
      </fieldset>

      <fieldset className="card stack" style={{ gap: 12 }}>
        <legend style={{ padding: "0 6px", fontWeight: 600 }}>Items to vote on</legend>
        <p className="small muted">Add at least two. Each voter spends 1, 2, 3, 4, 5, 6, 7, 8, 10, 12 points across distinct items.</p>
        {items.map((it, idx) => (
          <div key={it.key} className="stack" style={{ gap: 6, borderTop: idx === 0 ? "none" : "1px solid var(--border)", paddingTop: idx === 0 ? 0 : 12 }}>
            <div className="row" style={{ gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 2 }}>
                <label className="label small">Title</label>
                <input
                  className="input"
                  placeholder={`Item ${idx + 1} title`}
                  value={it.title}
                  onChange={(e) => updateItem(it.key, { title: e.target.value })}
                  maxLength={200}
                />
              </div>
              <div style={{ flex: 3 }}>
                <label className="label small">Image URL (optional)</label>
                <input
                  className="input"
                  placeholder="https://…"
                  value={it.imageUrl}
                  onChange={(e) => updateItem(it.key, { imageUrl: e.target.value })}
                />
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeItem(it.key)}
                disabled={items.length <= 2}
                title={items.length <= 2 ? "Need at least 2 items" : "Remove"}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn"
          onClick={() => setItems((p) => [...p, emptyItem()])}
        >
          + Add item
        </button>
      </fieldset>

      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Creating…" : "Create voting"}
        </button>
      </div>
    </form>
  );
}
