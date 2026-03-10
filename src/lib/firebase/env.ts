function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function requireEnv(name: string, value: string | undefined): string {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return normalized;
}

function requireServerEnv(name: string): string {
  const normalized = normalizeEnvValue(process.env[name]);
  if (!normalized) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return normalized;
}

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
};

export type FirebaseAdminConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

export function getFirebaseClientConfig(): FirebaseClientConfig {
  const apiKey = requireEnv("NEXT_PUBLIC_FIREBASE_API_KEY", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const authDomain = requireEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  const projectId = requireEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const appId = requireEnv("NEXT_PUBLIC_FIREBASE_APP_ID", process.env.NEXT_PUBLIC_FIREBASE_APP_ID);

  if (process.env.NODE_ENV !== "production") {
    console.log("Firebase API key present:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId
  };
}

export function getFirebaseAdminConfig(): FirebaseAdminConfig {
  const projectId =
    normalizeEnvValue(process.env.FIREBASE_PROJECT_ID) ||
    normalizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const clientEmail = requireServerEnv("FIREBASE_CLIENT_EMAIL");
  const privateKeyRaw = requireServerEnv("FIREBASE_PRIVATE_KEY");

  if (!projectId) {
    throw new Error("Missing FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable.");
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n")
  };
}
