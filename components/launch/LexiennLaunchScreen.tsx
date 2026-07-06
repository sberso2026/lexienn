"use client";

import { useCallback, useEffect, useState } from "react";
import { playLaunchSound, preloadLaunchSounds, resumeLaunchAudioContext } from "@/lib/audio/launchSounds";
import {
  markLaunchSeenThisSession,
  loadLaunchPreferences,
} from "@/lib/launch/launchPreferences";
import {
  markLaunchShownEver,
  shouldUseReducedMotionLaunch,
} from "@/lib/launch/shouldShowLaunchScreen";
import {
  LexiennLogoBlueSwoosh,
  LexiennLogoBookL,
  LexiennLogoComplete,
  LexiennLogoPageFold,
  LexiennLogoRedSwoosh,
  LexiennLogoStar,
} from "@/components/launch/lexiennLogoParts";
import { LexiennBrandLogo } from "@/components/brand/LexiennBrandLogo";
import { ActionButton } from "@/components/ui/ActionButton";

type Phase = "tap" | "animating" | "done";

interface LexiennLaunchScreenProps {
  onComplete: () => void;
}

const ANIMATION_MS = 2400;
const MAX_WAIT_MS = 3000;

export function LexiennLaunchScreen({ onComplete }: LexiennLaunchScreenProps) {
  const reducedMotion = shouldUseReducedMotionLaunch();
  const [phase, setPhase] = useState<Phase>("tap");
  const [showComplete, setShowComplete] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  const finish = useCallback(() => {
    markLaunchSeenThisSession();
    markLaunchShownEver();
    setFadingOut(true);
    window.setTimeout(onComplete, 320);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    finish();
  }, [finish]);

  const startAnimation = useCallback(async () => {
    const prefs = loadLaunchPreferences();
    await resumeLaunchAudioContext();
    if (prefs.soundEnabled && !reducedMotion) {
      void preloadLaunchSounds();
    }

    if (reducedMotion) {
      setPhase("animating");
      setShowComplete(true);
      window.setTimeout(finish, 700);
      return;
    }

    setPhase("animating");

    const cues: Array<{ at: number; cue: Parameters<typeof playLaunchSound>[0] }> = [
      { at: 180, cue: "blueSwoosh" },
      { at: 420, cue: "redSwoosh" },
      { at: 760, cue: "bookLock" },
      { at: 1180, cue: "starLock" },
      { at: 1900, cue: "finalBurst" },
    ];

    if (prefs.soundEnabled) {
      for (const { at, cue } of cues) {
        window.setTimeout(() => void playLaunchSound(cue), at);
      }
    }

    window.setTimeout(() => setShowComplete(true), 1700);
    window.setTimeout(finish, ANIMATION_MS);
  }, [finish, reducedMotion]);

  useEffect(() => {
    const safety = window.setTimeout(() => {
      if (phase !== "done") finish();
    }, MAX_WAIT_MS);
    return () => window.clearTimeout(safety);
  }, [finish, phase]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#1a3f6b_0%,#0b1f38_70%)] transition-opacity duration-300 ${
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="Lexienn launch"
    >
      {phase === "tap" ? (
        <div className="flex flex-col items-center gap-4 px-6 text-center">
          <LexiennBrandLogo size="install" className="opacity-95" priority />
          <p className="text-sm text-slate-200">Tap to start Lexienn</p>
          <ActionButton
            variant="primary"
            onClick={() => void startAnimation()}
            aria-label="Enter Lexienn"
          >
            Enter Lexienn
          </ActionButton>
        </div>
      ) : (
        <div className="relative h-40 w-40">
          {!reducedMotion && !showComplete && (
            <>
              <LexiennLogoBlueSwoosh className="launch-piece launch-blue absolute inset-0 h-full w-full" />
              <LexiennLogoRedSwoosh className="launch-piece launch-red absolute inset-0 h-full w-full" />
              <LexiennLogoBookL className="launch-piece launch-book absolute inset-0 h-full w-full" />
              <LexiennLogoPageFold className="launch-piece launch-page absolute inset-0 h-full w-full" />
              <LexiennLogoStar className="launch-piece launch-star absolute inset-0 h-full w-full" />
              <div className="launch-alignment absolute inset-0 rounded-full border border-white/10" />
            </>
          )}
          <LexiennLogoComplete
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${
              showComplete || reducedMotion ? "launch-complete opacity-100" : "opacity-0"
            }`}
          />
        </div>
      )}

      {phase === "animating" && !fadingOut && (
        <button
          type="button"
          onClick={handleSkip}
          className="absolute bottom-8 text-xs text-slate-300 underline"
        >
          Skip
        </button>
      )}
    </div>
  );
}
