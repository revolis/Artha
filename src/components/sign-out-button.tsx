"use client";

import { LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { clearAuthToken } from "@/lib/firebase/browser";
import { getFirebaseAuth } from "@/lib/firebase/client";

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
      if (key.includes("firebase")) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
  }
}

export function SignOutButton() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = getFirebaseAuth().currentUser;
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await signOut(getFirebaseAuth());
    clearAllStorage();
    document.cookie = "artha_auth=; Path=/; Max-Age=0; SameSite=Lax";
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      {email && (
        <span className="hidden text-sm text-mutedForeground md:inline truncate max-w-[180px]" title={email}>
          {email}
        </span>
      )}
      <Button variant="outline" onClick={handleSignOut} className="gap-2">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
