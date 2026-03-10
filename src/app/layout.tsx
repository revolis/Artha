import type { Metadata } from "next";
import "@/app/globals.css";
import { LayoutShell } from "@/components/layout-shell";
<<<<<<< HEAD
import { AuthProvider } from "@/components/auth-provider";
=======
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
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
<<<<<<< HEAD
        <AuthProvider>
          <SettingsProvider>
            <PrivateModeProvider>
              <TooltipProvider>
                <LayoutShell>{children}</LayoutShell>
              </TooltipProvider>
            </PrivateModeProvider>
          </SettingsProvider>
        </AuthProvider>
=======
        <SettingsProvider>
          <PrivateModeProvider>
            <TooltipProvider>
              <LayoutShell>{children}</LayoutShell>
            </TooltipProvider>
          </PrivateModeProvider>
        </SettingsProvider>
>>>>>>> 31dff062059e19b9530ba2cc08afd4c17b9be688
      </body>
    </html>
  );
}
