"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebase, firebaseStorageConfigured } from "./firebase";

/** Hard cap on what we accept from the file picker. */
const MAX_INPUT_BYTES = 25 * 1024 * 1024;
/** Hard cap on what we actually send to Storage (post-compression). */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Images are downscaled so their longest edge is at most this. */
const MAX_EDGE_PX = 1600;
/** Files at or below this size skip re-encoding entirely. */
const SKIP_COMPRESSION_BYTES = 900 * 1024;

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload an item image to Firebase Storage under `votings/<uid>/<random>.<ext>`
 * and return its public download URL.
 *
 * Large photos (e.g. straight off a phone camera) are downscaled and
 * re-encoded in the browser before upload, so voters aren't stuck loading
 * multi-megabyte originals. GIFs are uploaded untouched to preserve animation.
 *
 * Requires the user to be signed in (Storage rules scope writes to their own
 * folder) and Storage to be enabled in the Firebase console.
 */
export async function uploadItemImage(file: File): Promise<UploadResult> {
  if (!firebaseStorageConfigured) {
    throw new Error(
      "Image uploads aren't set up on this deployment — paste an image link instead.",
    );
  }
  if (!ALLOWED.includes(file.type)) {
    throw new Error("That file type isn't supported — use a PNG, JPEG, WebP or GIF.");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("That image is over 25MB — pick a smaller one.");
  }

  const { auth, storage } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Sign in to upload images.");

  const prepared = await prepareForUpload(file);
  if (prepared.blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("Couldn't shrink that image under 5MB — try a smaller one.");
  }

  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${prepared.ext}`;
  const path = `votings/${uid}/${safeName}`;
  const r = ref(storage, path);
  try {
    await uploadBytes(r, prepared.blob, { contentType: prepared.contentType });
  } catch {
    throw new Error(
      "Upload failed. If this keeps happening, Firebase Storage may not be enabled for this project.",
    );
  }
  const url = await getDownloadURL(r);
  return { url, path };
}

interface PreparedImage {
  blob: Blob;
  contentType: string;
  ext: string;
}

async function prepareForUpload(file: File): Promise<PreparedImage> {
  // Animated GIFs would lose their animation through a canvas round-trip.
  if (file.type === "image/gif") {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("GIFs can't be compressed — keep them under 5MB.");
    }
    return { blob: file, contentType: file.type, ext: "gif" };
  }

  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await decodeImage(file);
  } catch {
    throw new Error("Couldn't read that image — the file may be corrupted.");
  }

  const width = bitmap.width;
  const height = bitmap.height;
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height));

  // Small enough and no resize needed → upload the original bytes.
  if (scale === 1 && file.size <= SKIP_COMPRESSION_BYTES) {
    releaseBitmap(bitmap);
    return { blob: file, contentType: file.type, ext: extFor(file.type) };
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    releaseBitmap(bitmap);
    return { blob: file, contentType: file.type, ext: extFor(file.type) };
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  releaseBitmap(bitmap);

  // PNG inputs may carry transparency, so re-encode those as PNG; everything
  // else becomes JPEG. (WebP output would be smaller but Safari's encoder
  // support is patchy.)
  const targetType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await canvasToBlob(canvas, targetType, 0.85);

  // Re-encoding tiny files can inflate them — keep whichever is smaller.
  if (!blob || blob.size >= file.size) {
    return { blob: file, contentType: file.type, ext: extFor(file.type) };
  }
  return { blob, contentType: targetType, ext: extFor(targetType) };
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      // from-image applies EXIF rotation, so phone photos come out upright.
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to the <img> decoder.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function releaseBitmap(bitmap: ImageBitmap | HTMLImageElement): void {
  if ("close" in bitmap) bitmap.close();
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function extFor(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}
