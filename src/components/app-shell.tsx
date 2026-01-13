"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpDown,
  BarChart3,
  Briefcase,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Gauge,
  Layers,
  LineChart,
  PieChart,
  Settings,
  Target
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePrivateMode } from "@/components/private-mode-provider";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/entries", label: "Entries", icon: ArrowUpDown },
  { href: "/portfolio", label: "Portfolio", icon: LineChart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/heatmap", label: "Year Heatmap", icon: Flame },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/tax-fees", label: "Tax & Fees", icon: Briefcase },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/sources", label: "Sources", icon: Layers },
  { href: "/insights", label: "Gemini Insights", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { enabled, toggle } = usePrivateMode();
  const [showTaxFees, setShowTaxFees] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetch("/api/tax-fees/availability", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return { available: false };
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setShowTaxFees(Boolean(payload.available));
      })
      .catch(() => {
        if (!active) return;
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleNavItems = React.useMemo(
    () => (showTaxFees ? navItems : navItems.filter((item) => item.href !== "/tax-fees")),
    [showTaxFees]
  );

  return (
    <div className="flex min-h-screen" data-private={enabled}>
      <aside className="hidden w-64 flex-col gap-6 border-r border-border bg-card/70 px-6 py-8 lg:flex">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">
            Rabin Finance OS
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Personal Command</h1>
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                  isActive
                    ? "bg-accent text-accentForeground shadow-soft"
                    : "text-mutedForeground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="outline" className="justify-start gap-2" onClick={toggle}>
          {enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          Private Mode
        </Button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-card/60 px-6 py-4 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-mutedForeground">
              Rabin Finance OS
            </p>
            <h2 className="text-lg font-semibold">Financial Overview</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="hidden sm:inline-flex">
              Quick Add
            </Button>
            <Button variant="outline" onClick={toggle} className="gap-2">
              {enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              Private
            </Button>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
