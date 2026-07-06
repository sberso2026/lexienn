import {
  clearLaunchSessionSeen,
  hasSeenLaunchThisSession,
  loadLaunchPreferences,
  prefersReducedMotion,
} from "@/lib/launch/launchPreferences";
import { isStandaloneApp } from "@/lib/pwa/isStandaloneApp";

const LAUNCH_EVER_KEY = "lexienn_launch_shown_ever";

export function hasSeenLaunchEver(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(LAUNCH_EVER_KEY) === "true";
  } catch {
    return true;
  }
}

export function markLaunchShownEver(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAUNCH_EVER_KEY, "true");
  } catch {
    // ignore
  }
}

export function shouldShowLaunchScreen(): boolean {
  if (typeof window === "undefined") return false;
  const prefs = loadLaunchPreferences();
  if (!prefs.animationEnabled) return false;
  if (hasSeenLaunchThisSession()) return false;
  if (isStandaloneApp()) return true;
  return !hasSeenLaunchEver();
}

export function shouldUseReducedMotionLaunch(): boolean {
  return prefersReducedMotion();
}

export function requestLaunchReplay(): void {
  clearLaunchSessionSeen();
}
