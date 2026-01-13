"use client";

import { usePathname } from "next/navigation";

import { AppShell } from "@/components/app-shell";

type LayoutShellProps = {
  children: React.ReactNode;
};

export function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith("/login");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
