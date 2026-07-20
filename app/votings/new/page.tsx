"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { parseEmailList } from "@/lib/emails";
import type { VotingAccess, VotingDto } from "@/lib/types";
import { ImagePicker } from "@/app/components/image-picker";

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
      setError("Add at least two items (each needs a title).");
      return;
    }

    let invitedEmails: string[] = [];
    if (access === "INVITE_ONLY") {
      const { emails, invalid } = parseEmailList(emailsText);
      if (invalid.length > 0) {
        setError(`These don't look like email addresses: ${invalid.join(", ")}`);
        return;
      }
      if (emails.length === 0) {
        setError("Invite at least one email, or switch to anyone-with-link.");
        return;
      }
      invitedEmails = emails;
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
    <form onSubmit={onSubmit} className="stack" style={{ gap: 24, maxWidth: 680 }}>
      <div>
        <h1 className="page-title">New voting board</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Set the stage, add the contenders, then share one link with your voters.
        </p>
      </div>

      {error && <div className="note note-error">{error}</div>}

      <section className="card stack" style={{ gap: 16 }}>
        <h2 className="section-title">The basics</h2>
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
          <label className="label" htmlFor="description">Description <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
          <textarea
            id="description"
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell voters what they're choosing between."
            maxLength={2000}
          />
        </div>
      </section>

      <section className="card stack" style={{ gap: 12 }}>
        <h2 className="section-title">Who can vote?</h2>
        <label className={`option${access === "LINK" ? " is-selected" : ""}`}>
          <input
            type="radio"
            name="access"
            value="LINK"
            checked={access === "LINK"}
            onChange={() => setAccess("LINK")}
          />
          <span>
            <strong>Anyone with the link.</strong>{" "}
            <span className="muted small">
              Anonymous voters get a per-browser token so they can&apos;t vote twice.
            </span>
          </span>
        </label>
        <label className={`option${access === "INVITE_ONLY" ? " is-selected" : ""}`}>
          <input
            type="radio"
            name="access"
            value="INVITE_ONLY"
            checked={access === "INVITE_ONLY"}
            onChange={() => setAccess("INVITE_ONLY")}
          />
          <span style={{ flex: 1 }}>
            <strong>Invite-only by email.</strong>{" "}
            <span className="muted small">Listed emails must sign in to vote.</span>
            {access === "INVITE_ONLY" && (
              <textarea
                className="textarea"
                style={{ marginTop: 10, minHeight: 64 }}
                placeholder="alice@example.com, bob@example.com"
                value={emailsText}
                onChange={(e) => setEmailsText(e.target.value)}
              />
            )}
          </span>
        </label>
        <p className="hint">You can change this later in board settings.</p>
      </section>

      <section className="card stack" style={{ gap: 14 }}>
        <div>
          <h2 className="section-title">Items to vote on</h2>
          <p className="hint">
            Add at least two. Each voter hands out 1–8, 10 and 12 points across
            different items.
          </p>
        </div>
        {items.map((it, idx) => (
          <div
            key={it.key}
            className="stack"
            style={{
              gap: 10,
              borderTop: idx === 0 ? "none" : "1px solid var(--border)",
              paddingTop: idx === 0 ? 0 : 14,
            }}
          >
            <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
              <label className="label" style={{ marginBottom: 0 }}>Item {idx + 1}</label>
              <button
                type="button"
                className="link-btn"
                onClick={() => removeItem(it.key)}
                disabled={items.length <= 2}
                title={items.length <= 2 ? "A board needs at least 2 items" : "Remove this item"}
              >
                Remove
              </button>
            </div>
            <input
              className="input"
              placeholder="Title, e.g. Dune: Part Three"
              value={it.title}
              onChange={(e) => updateItem(it.key, { title: e.target.value })}
              maxLength={200}
            />
            <ImagePicker
              value={it.imageUrl}
              onChange={(url) => updateItem(it.key, { imageUrl: url })}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn"
          style={{ alignSelf: "flex-start" }}
          onClick={() => setItems((p) => [...p, emptyItem()])}
        >
          + Add another item
        </button>
      </section>

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
