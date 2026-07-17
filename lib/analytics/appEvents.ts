import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";

export type AppEventName =
  | "app_installed_detected"
  | "install_gate_viewed"
  | "launch_animation_completed"
  | "dictionary_lookup_completed"
  | "translation_completed"
  | "lens_scan_started"
  | "microphone_permission_denied"
  | "feedback_submitted";

export type AppEventPayload = Record<string, string | number | boolean | null | undefined>;

const COUNTERS_KEY = "lexienn_event_counters";

function loadCounters(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COUNTERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

function persistCounters(counters: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
  } catch {
    // ignore quota
  }
}

/** Privacy-conscious: never store free-text content here. */
export function trackAppEvent(name: AppEventName, payload: AppEventPayload = {}): void {
  const safePayload: AppEventPayload = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string" && value.length > 80) continue;
    if (key.toLowerCase().includes("text") || key.toLowerCase().includes("transcript")) {
      continue;
    }
    safePayload[key] = value;
  }

  if (isDeveloperModeFeatureEnabled() && typeof console !== "undefined") {
    console.debug(`[lexienn:event] ${name}`, safePayload);
  }

  if (typeof window === "undefined") return;
  const counters = loadCounters();
  counters[name] = (counters[name] ?? 0) + 1;
  persistCounters(counters);
}

export function getAppEventCounters(): Record<string, number> {
  return loadCounters();
}

export function clearAppEventCounters(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(COUNTERS_KEY);
  } catch {
    // ignore
  }
}
