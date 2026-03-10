import { headers } from "next/headers";

import { getAdminAuth } from "@/lib/firebase/admin";
import { createFirestoreDbClient } from "@/lib/firebase/db-client";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

export function createFirebaseRouteClient() {
  return { client: createFirestoreDbClient() };
}

function readAuthTokenFromHeaders(request?: Request): string | null {
  const directAuthHeader = request?.headers.get("authorization");
  const directToken = request?.headers.get("x-firebase-auth");

  if (directAuthHeader?.toLowerCase().startsWith("bearer ")) {
    return directAuthHeader.substring(7).trim();
  }

  if (directToken) {
    return directToken.trim();
  }

  const headerStore = headers();
  const contextAuthHeader = headerStore.get("authorization");
  const contextToken = headerStore.get("x-firebase-auth");

  if (contextAuthHeader?.toLowerCase().startsWith("bearer ")) {
    return contextAuthHeader.substring(7).trim();
  }

  if (contextToken) {
    return contextToken.trim();
  }

  return null;
}

export async function getAuthenticatedUser(request?: Request): Promise<AuthenticatedUser | null> {
  const token = readAuthTokenFromHeaders(request);
  if (!token) {
    return null;
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      id: decoded.uid,
      email: decoded.email ?? null
    };
  } catch (error) {
    console.error("Failed to verify Firebase auth token.", error);
    return null;
  }
}
