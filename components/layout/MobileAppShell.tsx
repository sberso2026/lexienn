import type { ReactNode } from "react";
import { ClientAppHeader } from "@/components/layout/ClientAppHeader";
import { AppNav } from "@/components/layout/AppNav";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { OfflineIndicator } from "@/components/layout/OfflineIndicator";

interface MobileAppShellProps {
  children: ReactNode;
}

export function MobileAppShell({ children }: MobileAppShellProps) {
  return (
    <div className="mobile-app-shell md:flex md:min-h-dvh md:flex-col">
      <ClientAppHeader />
      <div className="hidden md:block">
        <AppNav />
      </div>
      <main id="main-content" className="mobile-app-content md:flex-1">
        <OfflineIndicator />
        {children}
      </main>
      <div id="mobile-app-chrome-root" className="mobile-app-chrome-root" />
      <MobileBottomNav />
    </div>
  );
}
