"use client";

import { usePathname } from "next/navigation";

import { AppShell } from "@/components/app-shell";

type LayoutShellProps = {
  children: React.ReactNode;
};

export function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const isPublicRoute = pathname === "/" || pathname.startsWith("/login");

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
