"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import {
  dismissInstallPrompt,
  isInstallPromptDismissed,
} from "@/lib/pwa/installPromptStorage";
import { isStandaloneApp } from "@/lib/pwa/isStandaloneApp";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

export function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [iosGuide, setIosGuide] = useState(false);

  useEffect(() => {
    if (isStandaloneApp() || isInstallPromptDismissed()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
      setIosGuide(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (isIosSafari()) {
      setIosGuide(true);
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    dismissInstallPrompt();
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    dismissInstallPrompt();
    setVisible(false);
  }, []);

  if (!visible || isStandaloneApp()) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 px-3 md:bottom-4">
      <CompactCard className="mx-auto max-w-md border border-[var(--card-border)] shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Install Lexienn</p>
            {iosGuide ? (
              <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-xs text-[var(--muted)]">
                <li>Tap Share</li>
                <li>Tap Add to Home Screen</li>
                <li>Open Lexienn from the new icon</li>
              </ol>
            ) : (
              <p className="mt-1 text-xs text-[var(--muted)]">
                Add Lexienn to your home screen for quick access.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-xs text-[var(--muted)] underline"
            aria-label="Dismiss install prompt"
          >
            Dismiss
          </button>
        </div>
        {!iosGuide && deferredPrompt && (
          <div className="mt-3">
            <ActionButton variant="primary" fullWidth onClick={() => void handleInstall()}>
              Install Lexienn
            </ActionButton>
          </div>
        )}
      </CompactCard>
    </div>
  );
}
