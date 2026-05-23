"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);
export const firebaseStorageConfigured = Boolean(config.storageBucket);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;

export function getFirebase(): { app: FirebaseApp; auth: Auth; storage: FirebaseStorage } {
  if (!firebaseConfigured) {
    throw new Error(
      "Firebase is not configured — set NEXT_PUBLIC_FIREBASE_* in .env.local",
    );
  }
  if (!_app) {
    _app = getApps()[0] ?? initializeApp(config);
    _auth = getAuth(_app);
    _storage = getStorage(_app);
  }
  return { app: _app, auth: _auth as Auth, storage: _storage as FirebaseStorage };
}

export const googleProvider = new GoogleAuthProvider();
