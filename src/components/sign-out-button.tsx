"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient, clearAuthToken } from "@/lib/supabase/browser";

const STORAGE_KEY = 'sb-auth-token';

function clearAllStorage() {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure`;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
  
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    clearAuthToken();
    
    const keys = Object.keys(window.localStorage);
    for (const key of keys) {
      if (key.includes('supabase') || key.includes('sb-')) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
  }
}

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    clearAllStorage();
    router.replace("/login");
    router.refresh();
  };

  return (
    <Button variant="outline" onClick={handleSignOut} className="gap-2">
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  );
}
