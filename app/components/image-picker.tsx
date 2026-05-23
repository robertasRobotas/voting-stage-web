"use client";

import { useRef, useState } from "react";
import { uploadItemImage } from "@/lib/upload";
import { firebaseStorageConfigured } from "@/lib/firebase";

/**
 * Combined image input: lets the owner either paste a URL or upload a file
 * to Firebase Storage. Always reports the final URL via `onChange` so the
 * rest of the form doesn't need to care which path was used.
 */
export function ImagePicker({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (url: string) => void;
  compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-pick of the same file later
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadItemImage(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row" style={{ gap: 8 }}>
        <input
          className="input"
          placeholder="Image URL or upload →"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={onPickFile}
        />
        <button
          type="button"
          className="btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || !firebaseStorageConfigured}
          title={
            firebaseStorageConfigured
              ? "Upload an image file"
              : "Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET to enable uploads"
          }
        >
          {uploading ? "Uploading…" : compact ? "📷" : "Upload image"}
        </button>
      </div>
      {error && <div className="error small">{error}</div>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          style={{
            maxHeight: 60,
            maxWidth: 120,
            objectFit: "cover",
            borderRadius: 6,
            border: "1px solid var(--border)",
          }}
        />
      )}
    </div>
  );
}
