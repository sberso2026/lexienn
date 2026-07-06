export const LAUNCH_PREFS_KEY = "lexienn_launch_preferences";

export type LaunchPreferences = {
  animationEnabled: boolean;
  soundEnabled: boolean;
};

export const DEFAULT_LAUNCH_PREFERENCES: LaunchPreferences = {
  animationEnabled: true,
  soundEnabled: true,
};

const SESSION_SEEN_KEY = "lexienn_launch_seen_session";
export const HAS_SEEN_LAUNCH_KEY = "lexienn_has_seen_launch";

export const MAX_BOOT_SPLASH_MS = 400;

export function loadLaunchPreferences(): LaunchPreferences {
  if (typeof window === "undefined") return DEFAULT_LAUNCH_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(LAUNCH_PREFS_KEY);
    if (!raw) return DEFAULT_LAUNCH_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<LaunchPreferences>;
    return {
      animationEnabled: parsed.animationEnabled ?? true,
      soundEnabled: parsed.soundEnabled ?? true,
    };
  } catch {
    return DEFAULT_LAUNCH_PREFERENCES;
  }
}

export function saveLaunchPreferences(patch: Partial<LaunchPreferences>): LaunchPreferences {
  const next = { ...loadLaunchPreferences(), ...patch };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LAUNCH_PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }
  return next;
}

export function hasSeenLaunchThisSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function markLaunchSeenThisSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_SEEN_KEY, "true");
  } catch {
    // ignore
  }
}

export function clearLaunchSessionSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SESSION_SEEN_KEY);
  } catch {
    // ignore
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hasSeenLaunchBefore(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return (
      window.localStorage.getItem(HAS_SEEN_LAUNCH_KEY) === "true" ||
      window.localStorage.getItem("lexienn_launch_shown_ever") === "true"
    );
  } catch {
    return true;
  }
}

export function markHasSeenLaunchBefore(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HAS_SEEN_LAUNCH_KEY, "true");
  } catch {
    // ignore
  }
}
