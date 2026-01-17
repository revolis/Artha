import type { Metadata } from "next";
import "@/app/globals.css";
import { LayoutShell } from "@/components/layout-shell";
import { PrivateModeProvider } from "@/components/private-mode-provider";
import { SettingsProvider } from "@/lib/hooks/use-settings";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "ARTHA MgMt",
  description: "Personal finance management command center",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>
          <PrivateModeProvider>
            <TooltipProvider>
              <LayoutShell>{children}</LayoutShell>
            </TooltipProvider>
          </PrivateModeProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
