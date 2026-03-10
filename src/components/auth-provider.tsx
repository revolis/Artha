"use client";

import * as React from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { clearAuthToken } from "@/lib/firebase/browser";
import { ensureAuthPersistence, getFirebaseAuth } from "@/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

function setAuthPresenceCookie(isAuthenticated: boolean) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  if (isAuthenticated) {
    document.cookie = `artha_auth=1; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
    return;
  }

  document.cookie = `artha_auth=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    ensureAuthPersistence()
      .catch(() => {
        // Persistence fallback is handled by Firebase defaults.
      })
      .finally(() => {
        if (!active) {
          return;
        }

        const firebaseAuth = getFirebaseAuth();
        unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
          if (!active) {
            return;
          }

          setUser(nextUser);
          setLoading(false);
          setAuthPresenceCookie(Boolean(nextUser));

          if (!nextUser) {
            clearAuthToken();
          }
        });
      });

    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, loading }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
