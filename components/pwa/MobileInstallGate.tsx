"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { LexiennBrandLogo } from "@/components/brand/LexiennBrandLogo";
import { ActionButton } from "@/components/ui/ActionButton";
import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import { setInstallGateBypassed } from "@/lib/pwa/installGateBypass";
import {
  getIOSInstallGuideMode,
  isAndroid,
  isIOS,
} from "@/lib/pwa/isStandaloneApp";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

interface MobileInstallGateProps {
  onDeveloperBypass?: () => void;
}

function SafariShareIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Safari share icon"
      role="img"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect
        x="5"
        y="9"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 4v9M12 4l-3 3M12 4l3 3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstallStep({
  number,
  children,
}: {
  number: number;
  children: ReactNode;
}) {
  return (
    <li>
      <span className="step-number" aria-hidden="true">
        {number}.
      </span>
      <div className="step-content">
        <span className="sr-only">Step {number}: </span>
        {children}
      </div>
    </li>
  );
}

export function MobileInstallGate({ onDeveloperBypass }: MobileInstallGateProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installOutcome, setInstallOutcome] = useState<"idle" | "accepted" | "dismissed">(
    "idle",
  );
  const [iosGuideMode, setIosGuideMode] = useState<ReturnType<typeof getIOSInstallGuideMode>>(
    null,
  );

  useEffect(() => {
    if (isIOS()) {
      setIosGuideMode(getIOSInstallGuideMode());
    }
  }, []);

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
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-y-auto bg-[radial-gradient(circle_at_top,#1a3f6b_0%,#0b1f38_65%)] px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-8 text-center text-white"
      role="dialog"
      aria-label="Install Lexienn"
    >
      <div className="mb-6 flex items-center justify-center bg-transparent">
        <LexiennBrandLogo size="install" priority className="drop-shadow-lg" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Install Lexienn</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-200">
        Add Lexienn to your home screen for the app experience.
      </p>
      <p className="mt-1 max-w-sm text-xs text-slate-300">
        Open from the home-screen icon to use Lexienn without the browser bar.
      </p>

      {iosGuideMode === "safari" && (
        <>
          <ol className="install-steps mt-6 w-full max-w-sm text-left text-sm text-slate-100">
            <InstallStep number={1}>
              <SafariShareIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-100" />
              <span>
                Tap the square-with-up-arrow icon at the bottom center of Safari.
              </span>
            </InstallStep>
            <InstallStep number={2}>
              <span>Scroll the menu if needed, then tap Add to Home Screen.</span>
            </InstallStep>
            <InstallStep number={3}>
              <span>Tap Add.</span>
            </InstallStep>
            <InstallStep number={4}>
              <span>Open Lexienn from the new Home Screen icon.</span>
            </InstallStep>
          </ol>
          <div className="mt-4 max-w-sm rounded-lg border border-white/20 bg-white/5 p-3 text-left text-xs leading-relaxed text-slate-200">
            <p className="font-semibold text-slate-100">Can&apos;t see the icon?</p>
            <p className="mt-1">
              The icon is in Safari&apos;s bottom toolbar. If the toolbar is hidden, tap the
              address bar or scroll slightly to reveal it. On iPad, it may appear near the
              top-right. If you opened Lexienn inside another app, open this page in Safari
              first.
            </p>
          </div>
        </>
      )}

      {iosGuideMode === "open-in-safari" && (
        <div className="mt-6 max-w-sm text-left">
          <p className="text-sm font-semibold text-amber-100">Open in Safari first</p>
          <p className="mt-2 text-sm text-slate-200">
            Lexienn must be installed from Safari. This browser cannot add apps to your home
            screen.
          </p>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-100">
            <li>Copy the page address or tap the menu in this app.</li>
            <li>Choose Open in Safari or paste the link into Safari.</li>
            <li>In Safari, follow the Add to Home Screen steps.</li>
          </ol>
        </div>
      )}

      {!isIOS() && deferredPrompt && (
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
