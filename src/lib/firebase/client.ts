"use client";

import type { FirebaseApp } from "firebase/app";
import { getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

import { getFirebaseClientConfig } from "@/lib/firebase/env";

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let persistenceInitialized = false;

function getOrInitClientApp(): FirebaseApp {
  if (cachedApp) {
    return cachedApp;
  }

  if (getApps().length > 0) {
    cachedApp = getApp();
    return cachedApp;
  }

  cachedApp = initializeApp(getFirebaseClientConfig());
  return cachedApp;
}

export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(getOrInitClientApp());
  }

  return cachedAuth;
}

export function getFirebaseDb(): Firestore {
  if (!cachedDb) {
    cachedDb = getFirestore(getOrInitClientApp());
  }

  return cachedDb;
}

export async function ensureAuthPersistence() {
  if (typeof window === "undefined") {
    return;
  }

  if (persistenceInitialized) {
    return;
  }

  await setPersistence(getFirebaseAuth(), browserLocalPersistence);
  persistenceInitialized = true;
}
