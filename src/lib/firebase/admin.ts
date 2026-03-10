import type { App } from "firebase-admin/app";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import { getAuth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { getFirestore } from "firebase-admin/firestore";

import { getFirebaseAdminConfig } from "@/lib/firebase/env";

let cachedApp: App | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

function getOrInitAdminApp(): App {
  if (cachedApp) {
    return cachedApp;
  }

  if (getApps().length > 0) {
    cachedApp = getApp();
    return cachedApp;
  }

  const adminConfig = getFirebaseAdminConfig();
  cachedApp = initializeApp({
    credential: cert({
      projectId: adminConfig.projectId,
      clientEmail: adminConfig.clientEmail,
      privateKey: adminConfig.privateKey
    }),
    projectId: adminConfig.projectId
  });

  return cachedApp;
}

export function getAdminAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(getOrInitAdminApp());
  }

  return cachedAuth;
}

export function getAdminDb(): Firestore {
  if (!cachedDb) {
    cachedDb = getFirestore(getOrInitAdminApp());
  }

  return cachedDb;
}
