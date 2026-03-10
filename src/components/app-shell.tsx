"use client";

import * as React from "react";
import Image from "next/image";
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
  Menu,
  PieChart,
  Settings,
  Target,
  X
} from "lucide-react";

import { fetchWithAuth } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { usePrivateMode } from "@/components/private-mode-provider";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/entries", label: "Entries", icon: ArrowUpDown },
  { href: "/portfolio", label: "Portfolio", icon: LineChart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/heatmap", label: "Year Heatmap", icon: Flame },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/tax-fees", label: "Tax & Fees", icon: Briefcase },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/sources", label: "Sources", icon: Layers },
  { href: "/insights", label: "AI Insights", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { enabled, toggle } = usePrivateMode();
  const [showTaxFees, setShowTaxFees] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    fetchWithAuth("/api/tax-fees/availability", { cache: "no-store" })
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

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const visibleNavItems = React.useMemo(
    () => (showTaxFees ? navItems : navItems.filter((item) => item.href !== "/tax-fees")),
    [showTaxFees]
  );

  return (
    <div className="flex min-h-screen" data-private={enabled}>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 flex-col gap-6 border-r border-border/60 bg-[#f5f2ed] px-6 py-8 transition-transform duration-300 lg:static lg:translate-x-0 lg:flex",
        mobileMenuOpen ? "translate-x-0 flex" : "-translate-x-full hidden lg:flex"
      )}>
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/logo.png" 
              alt="ARTHA" 
              width={40} 
              height={40}
              className="h-10 w-10"
            />
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto">
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
        <Button variant="outline" size="icon" onClick={toggle} title={enabled ? "Disable Private Mode" : "Enable Private Mode"}>
          {enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </aside>

      <div className="flex flex-1 flex-col bg-[#faf8f5]">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border/50 bg-[#faf8f5]/95 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                ARTHA MgMt
              </p>
              <h2 className="text-lg font-semibold text-foreground">Financial Overview</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="icon" onClick={toggle} className="bg-white/80" title={enabled ? "Disable Private Mode" : "Enable Private Mode"}>
              {enabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 overflow-x-auto px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
