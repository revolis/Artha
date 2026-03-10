"use client";

<<<<<<< HEAD
import * as React from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/components/auth-provider";
=======
import { usePathname } from "next/navigation";

import { AppShell } from "@/components/app-shell";
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

type LayoutShellProps = {
  children: React.ReactNode;
};

export function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
<<<<<<< HEAD
  const router = useRouter();
  const { user, loading } = useAuth();
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/reports/shared/");

  React.useEffect(() => {
    if (isPublicRoute || loading) return;
    if (!user) {
      router.replace("/login");
    }
  }, [isPublicRoute, loading, router, user]);
=======
  const isPublicRoute = pathname === "/" || pathname.startsWith("/login");
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688

  if (isPublicRoute) {
    return <>{children}</>;
  }

<<<<<<< HEAD
  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf8f5]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
  return <AppShell>{children}</AppShell>;
}
