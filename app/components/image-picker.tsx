"use client";

import { useId, useRef, useState } from "react";
import { uploadItemImage } from "@/lib/upload";
import { firebaseStorageConfigured } from "@/lib/firebase";

/**
 * Image input for voting items. Upload-first: click or drop a file onto the
 * thumbnail to upload it to Firebase Storage; a link option is tucked behind
 * "paste a link" for people who already have a URL. Reports the final URL via
 * `onChange` either way.
 */
export function ImagePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);
  const [broken, setBroken] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadItemImage(file);
      setBroken(false);
      onChange(url);
      setShowUrlField(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed — try again.");
    } finally {
      setUploading(false);
    }
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    void handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }

  const canUpload = firebaseStorageConfigured;
  const hasImage = value.trim().length > 0;

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 12, alignItems: "center", flexWrap: "nowrap" }}>
        <button
          type="button"
          className={`dropzone${hasImage ? " has-image" : ""}${dragOver ? " is-drag" : ""}`}
          onClick={() => (canUpload ? fileRef.current?.click() : setShowUrlField(true))}
          onDragOver={(e) => {
            e.preventDefault();
            if (canUpload) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={canUpload ? onDrop : undefined}
          aria-label={hasImage ? "Replace image" : "Add an image"}
          title={
            canUpload
              ? hasImage
                ? "Click to replace, or drop a new image"
                : "Click to upload, or drop an image here"
              : "Paste an image link"
          }
        >
          {hasImage && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" onError={() => setBroken(true)} />
          ) : (
            <PhotoGlyph />
          )}
          {uploading && (
            <span className="dropzone-busy">
              <span className="spinner" aria-hidden />
            </span>
          )}
        </button>

        <div className="stack" style={{ gap: 4, minWidth: 0 }}>
          <div className="row" style={{ gap: 8 }}>
            {canUpload && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : hasImage ? "Replace" : "Upload photo"}
              </button>
            )}
            {hasImage && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setBroken(false);
                  setError(null);
                  onChange("");
                }}
                disabled={uploading}
              >
                Remove
              </button>
            )}
          </div>
          {!showUrlField && (
            <button
              type="button"
              className="link-btn"
              style={{ alignSelf: "flex-start" }}
              onClick={() => setShowUrlField(true)}
            >
              {canUpload ? "or paste an image link" : "paste an image link"}
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={onPickFile}
        />
      </div>

      {showUrlField && (
        <input
          className="input"
          type="url"
          placeholder="https://example.com/photo.jpg"
          value={value}
          autoFocus
          onChange={(e) => {
            setBroken(false);
            onChange(e.target.value);
          }}
        />
      )}

      {broken && hasImage && !uploading && (
        <p className="small muted">That image link doesn&apos;t load — check the URL.</p>
      )}
      {error && <div className="note note-error small">{error}</div>}
    </div>
  );
}

function PhotoGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="10" r="1.7" fill="currentColor" />
      <path
        d="M6 16.5l3.8-3.6a1 1 0 0 1 1.35-.02l2.55 2.27 1.9-1.7a1 1 0 0 1 1.32-.01L20 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
