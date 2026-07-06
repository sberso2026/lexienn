"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { LexiennLaunchScreen } from "@/components/launch/LexiennLaunchScreen";
import { MobileInstallGate } from "@/components/pwa/MobileInstallGate";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { shouldShowLaunchScreen } from "@/lib/launch/shouldShowLaunchScreen";
import { shouldShowMobileInstallGate } from "@/lib/pwa/shouldShowMobileInstallGate";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [installGateOpen, setInstallGateOpen] = useState(false);
  const [shellReady, setShellReady] = useState(false);
  const [showLaunch, setShowLaunch] = useState(false);
  const [launchDone, setLaunchDone] = useState(false);

  useEffect(() => {
    const gated = shouldShowMobileInstallGate();
    setInstallGateOpen(gated);
    if (!gated) {
      setShowLaunch(shouldShowLaunchScreen());
    }
    setShellReady(true);
  }, []);

  const handleLaunchComplete = useCallback(() => {
    setShowLaunch(false);
    setLaunchDone(true);
  }, []);

  const handleDeveloperBypass = useCallback(() => {
    setInstallGateOpen(false);
    setShowLaunch(shouldShowLaunchScreen());
  }, []);

  if (!shellReady) {
    return <ServiceWorkerRegister />;
  }

  if (installGateOpen) {
    return (
      <>
        <ServiceWorkerRegister />
        <MobileInstallGate onDeveloperBypass={handleDeveloperBypass} />
      </>
    );
  }

  return (
    <>
      <ServiceWorkerRegister />
      {!launchDone && showLaunch && (
        <LexiennLaunchScreen onComplete={handleLaunchComplete} />
      )}
      {children}
    </>
  );
}
