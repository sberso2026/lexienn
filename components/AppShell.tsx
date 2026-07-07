"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LexiennBootSplash } from "@/components/app/LexiennBootSplash";
import { TapDiagnostics } from "@/components/app/TapDiagnostics";
import { LexiennLaunchScreen } from "@/components/launch/LexiennLaunchScreen";
import { MobileInstallGate } from "@/components/pwa/MobileInstallGate";
import { ClientErrorReporter } from "@/components/pwa/ClientErrorReporter";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import {
  isAppBootChecking,
  resolveAppBootState,
  shouldRenderSignInPanel,
} from "@/lib/app/appBoot";
import {
  hasSeenLaunchBefore,
  MAX_BOOT_SPLASH_MS,
} from "@/lib/launch/launchPreferences";
import { logPerf } from "@/lib/request/perfLog";
import { shouldShowLaunchScreen } from "@/lib/launch/shouldShowLaunchScreen";
import { shouldShowMobileInstallGate } from "@/lib/pwa/shouldShowMobileInstallGate";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Boot overlays are layered above app chrome; navigation/header/bottom nav stay
 * mounted after the install gate so entry creation never unmounts interactive UI.
 */
export function AppShell({ children }: AppShellProps) {
  const seenLaunchBefore = hasSeenLaunchBefore();
  const [bootState, setBootState] = useState<ReturnType<typeof resolveAppBootState>>({
    auth: "checking",
    showSignIn: false,
  });
  const [installGateOpen, setInstallGateOpen] = useState(false);
  const [showLaunch, setShowLaunch] = useState(false);
  const [appContentVisible, setAppContentVisible] = useState(seenLaunchBefore);
  const bootCompletedRef = useRef(seenLaunchBefore);

  useEffect(() => {
    const bootStarted = performance.now();
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
      const splashMs = seenLaunchBefore ? 0 : MAX_BOOT_SPLASH_MS;
      const timer = window.setTimeout(() => {
        bootCompletedRef.current = true;
        setAppContentVisible(true);
        logPerf("boot_ready", { durationMs: Math.round(performance.now() - bootStarted) });
      }, splashMs);
      return () => window.clearTimeout(timer);
    }
  }, [seenLaunchBefore]);

  const handleLaunchComplete = useCallback(() => {
    bootCompletedRef.current = true;
    setShowLaunch(false);
    setAppContentVisible(true);
  }, []);

  const handleDeveloperBypass = useCallback(() => {
    setInstallGateOpen(false);
    const launch = shouldShowLaunchScreen();
    setShowLaunch(launch);
    if (!launch) {
      bootCompletedRef.current = true;
    }
    setAppContentVisible(!launch);
  }, []);

  const shellOverlay = (
    <>
      <ServiceWorkerRegister />
      <ClientErrorReporter />
      <TapDiagnostics />
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
  const bootOverlayVisible = !launchActive && !appContentVisible && !bootCompletedRef.current;

  return (
    <>
      {shellOverlay}
      {children}
      {launchActive && <LexiennLaunchScreen onComplete={handleLaunchComplete} />}
      {bootOverlayVisible && <LexiennBootSplash />}
    </>
  );
}
