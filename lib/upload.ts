"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebase, firebaseStorageConfigured } from "./firebase";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload an image file to Firebase Storage under `votings/<uid>/<random>.<ext>`
 * and return its public download URL. Requires the user to be signed in (so
 * Storage rules can scope writes to their own folder) and Storage to be
 * enabled in the Firebase console.
 */
export async function uploadItemImage(file: File): Promise<UploadResult> {
  if (!firebaseStorageConfigured) {
    throw new Error(
      "Firebase Storage isn't configured — set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    );
  }
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Only PNG / JPEG / WebP / GIF images are supported");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`Image too large (max ${MAX_BYTES / 1024 / 1024}MB)`);
  }

  const { auth, storage } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("You must be signed in to upload an image");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `votings/${uid}/${safeName}`;
  const r = ref(storage, path);
  await uploadBytes(r, file, { contentType: file.type });
  const url = await getDownloadURL(r);
  return { url, path };
}
