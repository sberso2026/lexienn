"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { LexiennLaunchScreen } from "@/components/launch/LexiennLaunchScreen";
import { InstallAppPrompt } from "@/components/pwa/InstallAppPrompt";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { shouldShowLaunchScreen } from "@/lib/launch/shouldShowLaunchScreen";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [showLaunch, setShowLaunch] = useState(false);
  const [launchDone, setLaunchDone] = useState(false);

  useEffect(() => {
    setShowLaunch(shouldShowLaunchScreen());
  }, []);

  const handleLaunchComplete = useCallback(() => {
    setShowLaunch(false);
    setLaunchDone(true);
  }, []);

  return (
    <>
      <ServiceWorkerRegister />
      {!launchDone && showLaunch && (
        <LexiennLaunchScreen onComplete={handleLaunchComplete} />
      )}
      {children}
      <InstallAppPrompt />
    </>
  );
}
