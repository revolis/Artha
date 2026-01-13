import type { Metadata } from "next";
import "@/app/globals.css";
import { LayoutShell } from "@/components/layout-shell";
import { PrivateModeProvider } from "@/components/private-mode-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Rabin Finance OS",
  description: "Personal finance command center"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivateModeProvider>
          <TooltipProvider>
            <LayoutShell>{children}</LayoutShell>
          </TooltipProvider>
        </PrivateModeProvider>
      </body>
    </html>
  );
}
