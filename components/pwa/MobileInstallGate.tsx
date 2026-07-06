"use client";

import { useCallback, useEffect, useState } from "react";
import { LexiennBrandLogo } from "@/components/brand/LexiennBrandLogo";
import { ActionButton } from "@/components/ui/ActionButton";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import { setInstallGateBypassed } from "@/lib/pwa/installGateBypass";
import { isAndroid, isSafariIOS } from "@/lib/pwa/isStandaloneApp";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface MobileInstallGateProps {
  onDeveloperBypass?: () => void;
}

export function MobileInstallGate({ onDeveloperBypass }: MobileInstallGateProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installOutcome, setInstallOutcome] = useState<"idle" | "accepted" | "dismissed">(
    "idle",
  );
  const iosGuide = isSafariIOS();
  const androidGuide = isAndroid() && !deferredPrompt;

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setInstallOutcome(choice.outcome);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDeveloperBypass = useCallback(() => {
    setInstallGateBypassed();
    onDeveloperBypass?.();
  }, [onDeveloperBypass]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,#1a3f6b_0%,#0b1f38_65%)] px-6 text-center text-white"
      role="dialog"
      aria-label="Install Lexienn"
    >
      <LexiennBrandLogo size="install" priority className="mb-6 drop-shadow-lg" />
      <h1 className="text-2xl font-semibold tracking-tight">Install Lexienn</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-200">
        Add Lexienn to your home screen for the app experience.
      </p>
      <p className="mt-1 max-w-sm text-xs text-slate-300">
        Open from the home-screen icon to use Lexienn without the browser bar.
      </p>

      {iosGuide && (
        <ol className="mt-6 max-w-sm list-decimal space-y-2 pl-5 text-left text-sm text-slate-100">
          <li>Tap the Share button.</li>
          <li>Tap Add to Home Screen.</li>
          <li>Tap Add.</li>
          <li>Open Lexienn from the new home-screen icon.</li>
        </ol>
      )}

      {!iosGuide && deferredPrompt && (
        <div className="mt-6 w-full max-w-sm">
          <ActionButton variant="primary" fullWidth onClick={() => void handleInstall()}>
            Install Lexienn
          </ActionButton>
        </div>
      )}

      {androidGuide && (
        <ol className="mt-6 max-w-sm list-decimal space-y-2 pl-5 text-left text-sm text-slate-100">
          <li>Open the Chrome menu (⋮).</li>
          <li>Tap Install app or Add to Home screen.</li>
          <li>Open Lexienn from your home screen.</li>
        </ol>
      )}

      {installOutcome === "accepted" && (
        <p className="mt-4 max-w-sm text-sm text-emerald-200">
          Open Lexienn from your home screen to continue.
        </p>
      )}

      {isDeveloperModeFeatureEnabled() && (
        <button
          type="button"
          onClick={handleDeveloperBypass}
          className="mt-8 text-xs text-slate-400 underline"
        >
          Developer bypass
        </button>
      )}
    </div>
  );
}
