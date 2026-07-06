"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { LexiennBootSplash } from "@/components/app/LexiennBootSplash";
import { LexiennLaunchScreen } from "@/components/launch/LexiennLaunchScreen";
import { MobileInstallGate } from "@/components/pwa/MobileInstallGate";
import { ClientErrorReporter } from "@/components/pwa/ClientErrorReporter";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import {
  isAppBootChecking,
  resolveAppBootState,
  shouldRenderSignInPanel,
} from "@/lib/app/appBoot";
import { shouldShowLaunchScreen } from "@/lib/launch/shouldShowLaunchScreen";
import { shouldShowMobileInstallGate } from "@/lib/pwa/shouldShowMobileInstallGate";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [bootState, setBootState] = useState<ReturnType<typeof resolveAppBootState>>({
    auth: "checking",
    showSignIn: false,
  });
  const [installGateOpen, setInstallGateOpen] = useState(false);
  const [showLaunch, setShowLaunch] = useState(false);
  const [appContentVisible, setAppContentVisible] = useState(false);

  useEffect(() => {
    const auth = resolveAppBootState();
    setBootState(auth);

    if (shouldRenderSignInPanel(auth)) {
      return;
    }

    const gated = shouldShowMobileInstallGate();
    setInstallGateOpen(gated);

    if (gated) {
      return;
    }

    const launch = shouldShowLaunchScreen();
    setShowLaunch(launch);
    if (!launch) {
      setAppContentVisible(true);
    }
  }, []);

  const handleLaunchComplete = useCallback(() => {
    setShowLaunch(false);
    setAppContentVisible(true);
  }, []);

  const handleDeveloperBypass = useCallback(() => {
    setInstallGateOpen(false);
    const launch = shouldShowLaunchScreen();
    setShowLaunch(launch);
    setAppContentVisible(!launch);
  }, []);

  const shellOverlay = (
    <>
      <ServiceWorkerRegister />
      <ClientErrorReporter />
    </>
  );

  if (isAppBootChecking(bootState)) {
    return (
      <>
        {shellOverlay}
        <LexiennBootSplash />
      </>
    );
  }

  if (shouldRenderSignInPanel(bootState)) {
    return (
      <>
        {shellOverlay}
        <LexiennBootSplash message="Checking account…" />
      </>
    );
  }

  if (installGateOpen) {
    return (
      <>
        {shellOverlay}
        <MobileInstallGate onDeveloperBypass={handleDeveloperBypass} />
      </>
    );
  }

  const launchActive = showLaunch && !appContentVisible;

  return (
    <>
      {shellOverlay}
      {launchActive && <LexiennLaunchScreen onComplete={handleLaunchComplete} />}
      {!launchActive && !appContentVisible && <LexiennBootSplash />}
      <div
        className={appContentVisible ? "contents" : "hidden"}
        aria-hidden={!appContentVisible}
      >
        {children}
      </div>
    </>
  );
}
