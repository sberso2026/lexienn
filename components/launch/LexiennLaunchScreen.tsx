"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

type Phase = "ready" | "animating" | "done";

interface LexiennLaunchScreenProps {
  onComplete: () => void;
}

const ASSEMBLY_MS = 2000;
const COMPLETE_HOLD_MS = 3000;
const ANIMATION_MS = ASSEMBLY_MS + COMPLETE_HOLD_MS;
const MAX_WAIT_MS = ANIMATION_MS + 800;

export function LexiennLaunchScreen({ onComplete }: LexiennLaunchScreenProps) {
  const reducedMotion = shouldUseReducedMotionLaunch();
  const [phase, setPhase] = useState<Phase>("ready");
  const [showComplete, setShowComplete] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const startedRef = useRef(false);

  const finish = useCallback(() => {
    markLaunchSeenThisSession();
    markLaunchShownEver();
    setPhase("done");
    setFadingOut(true);
    window.setTimeout(onComplete, 450);
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    finish();
  }, [finish]);

  const startAnimation = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    const prefs = loadLaunchPreferences();
    await resumeLaunchAudioContext();
    if (prefs.soundEnabled && !reducedMotion) {
      void preloadLaunchSounds();
    }

    if (reducedMotion) {
      setPhase("animating");
      setShowComplete(true);
      window.setTimeout(finish, COMPLETE_HOLD_MS);
      return;
    }

    setPhase("animating");

    const cues: Array<{ at: number; cue: Parameters<typeof playLaunchSound>[0] }> = [
      { at: 250, cue: "blueSwoosh" },
      { at: 600, cue: "redSwoosh" },
      { at: 1050, cue: "bookLock" },
      { at: 1650, cue: "starLock" },
      { at: ASSEMBLY_MS, cue: "finalBurst" },
    ];

    if (prefs.soundEnabled) {
      for (const { at, cue } of cues) {
        window.setTimeout(() => void playLaunchSound(cue), at);
      }
    }

    window.setTimeout(() => setShowComplete(true), ASSEMBLY_MS);
    window.setTimeout(finish, ANIMATION_MS);
  }, [finish, reducedMotion]);

  useEffect(() => {
    if (phase !== "animating") return;
    const safety = window.setTimeout(() => {
      finish();
    }, MAX_WAIT_MS);
    return () => window.clearTimeout(safety);
  }, [finish, phase]);

  return (
    <div
      className={`boot-overlay fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#1a3f6b_0%,#0b1f38_70%)] px-6 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] transition-opacity duration-300 ${
        fadingOut ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="Lexienn launch"
    >
      {phase === "ready" && (
        <div className="flex flex-col items-center gap-6">
          <LexiennLogoComplete className="h-28 w-28 object-contain opacity-90" />
          <p className="text-sm text-slate-200" aria-live="polite">
            Lexienn is ready
          </p>
          <button
            type="button"
            onClick={() => void startAnimation()}
            className="min-h-11 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0b1f38] shadow-lg"
          >
            Tap to open
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="min-h-11 text-xs text-slate-300 underline"
          >
            Skip
          </button>
        </div>
      )}

      {phase === "animating" && (
        <div className="relative h-40 w-40">
          {(showComplete || reducedMotion) && (
            <div
              className="launch-complete-glow pointer-events-none absolute inset-[-20%] rounded-full"
              aria-hidden
            />
          )}
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
          className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] min-h-11 text-xs text-slate-300 underline"
        >
          Skip
        </button>
      )}
    </div>
  );
}
