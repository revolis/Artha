"use client";

import { onAuthStateChanged } from "firebase/auth";

import { ensureAuthPersistence, getFirebaseAuth } from "@/lib/firebase/client";

let authReadyPromise: Promise<void> | null = null;

function waitForAuthReady(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      const firebaseAuth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(firebaseAuth, () => {
        unsubscribe();
        resolve();
      });
    });
  }

  return authReadyPromise;
}

export function getFirebaseBrowserAuth() {
  return getFirebaseAuth();
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }

  const normalized: Record<string, string> = {};
  const headerObject = new Headers(headers);

  headerObject.forEach((value, key) => {
    normalized[key] = value;
  });

  return normalized;
}

export async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  try {
    await ensureAuthPersistence();
  } catch {
    // Persistence setup can fail in restricted contexts; auth can still work.
  }

  try {
    await waitForAuthReady();

    const firebaseAuth = getFirebaseAuth();
    const user = firebaseAuth.currentUser;
    if (!user) {
      return {};
    }

    const token = await user.getIdToken(forceRefresh);
    if (!token) {
      return {};
    }

    return {
      authorization: `Bearer ${token}`,
      "x-firebase-auth": token
    };
  } catch {
    return {};
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const baseHeaders = normalizeHeaders(options.headers);

  const sendRequest = (headers: Record<string, string>) =>
    fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...baseHeaders,
        ...headers
      }
    });

  let response = await sendRequest(authHeaders);

  if (response.status === 401 && Object.keys(authHeaders).length > 0) {
    const refreshedHeaders = await getAuthHeaders(true);
    if (Object.keys(refreshedHeaders).length > 0) {
      response = await sendRequest(refreshedHeaders);
    }
  }

  return response;
}

export function clearAuthToken() {
  authReadyPromise = null;
}
