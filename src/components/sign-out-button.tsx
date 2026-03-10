"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { clearAuthToken } from "@/lib/firebase/browser";
import { getFirebaseAuth } from "@/lib/firebase/client";

function clearSessionState() {
  if (typeof document !== "undefined") {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `artha_auth=; path=/; max-age=0; SameSite=Lax${secure}`;
  }

  try {
    clearAuthToken();
  } catch {
    // no-op
  }
}

export function SignOutButton() {
  const router = useRouter();
  const { user } = useAuth();
  const [pending, setPending] = React.useState(false);

  const handleSignOut = async () => {
    if (pending) return;

    setPending(true);
    try {
      const firebaseAuth = getFirebaseAuth();
      await signOut(firebaseAuth);
      clearSessionState();
      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {user?.email ? (
        <span className="hidden max-w-[180px] truncate text-sm text-mutedForeground md:inline" title={user.email}>
          {user.email}
        </span>
      ) : null}
      <Button variant="outline" onClick={handleSignOut} className="gap-2" disabled={pending}>
        <LogOut className="h-4 w-4" />
        {pending ? "Signing Out..." : "Sign Out"}
      </Button>
    </div>
  );
}
