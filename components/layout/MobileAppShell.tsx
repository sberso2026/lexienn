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
    <div className="app-shell flex min-h-dvh flex-col">
      <ClientAppHeader />
      <OfflineIndicator />
      <div className="hidden md:block">
        <AppNav />
      </div>
      <div className="safe-bottom flex-1">{children}</div>
      <MobileBottomNav />
    </div>
  );
}
