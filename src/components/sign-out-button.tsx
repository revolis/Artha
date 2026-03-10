"use client";

<<<<<<< HEAD
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
=======
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient, clearAuthToken } from "@/lib/supabase/browser";

function clearAllStorage() {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
  
  try {
    clearAuthToken();
    
    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (key.includes('supabase') || key.includes('sb-')) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  }
}

export function SignOutButton() {
  const router = useRouter();
<<<<<<< HEAD
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
=======
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    clearAllStorage();
    router.replace("/login");
    router.refresh();
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  };

  return (
    <div className="flex items-center gap-3">
<<<<<<< HEAD
      {user?.email ? (
        <span className="hidden max-w-[180px] truncate text-sm text-mutedForeground md:inline" title={user.email}>
          {user.email}
        </span>
      ) : null}
      <Button variant="outline" onClick={handleSignOut} className="gap-2" disabled={pending}>
        <LogOut className="h-4 w-4" />
        {pending ? "Signing Out..." : "Sign Out"}
=======
      {email && (
        <span className="hidden text-sm text-mutedForeground md:inline truncate max-w-[180px]" title={email}>
          {email}
        </span>
      )}
      <Button variant="outline" onClick={handleSignOut} className="gap-2">
        <LogOut className="h-4 w-4" />
        Sign Out
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      </Button>
    </div>
  );
}
