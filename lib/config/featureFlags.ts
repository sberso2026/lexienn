/**
 * Batch 51 feature flags (public / browser-safe).
 * Defaults keep shipped behavior on unless explicitly disabled.
 */

function envFlag(name: string, defaultEnabled: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return defaultEnabled;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "false" || normalized === "0" || normalized === "off") return false;
  if (normalized === "true" || normalized === "1" || normalized === "on") return true;
  return defaultEnabled;
}

export function isConversationEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_CONVERSATION_ENABLED", true);
}

export function isAutomaticLanguageDetectionFlagEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_AUTO_LANGUAGE_DETECT", true);
}

export function isLiveLensOverlayEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_LIVE_LENS_OVERLAY_ENABLED", false);
}

export function isVisualObjectUnderstandingEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_VISUAL_OBJECT_UNDERSTANDING_ENABLED", false);
}

export function isAdvancedLearningEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_ADVANCED_LEARNING_ENABLED", true);
}

export function isSmartOfflinePackEnabled(): boolean {
  return envFlag("NEXT_PUBLIC_SMART_OFFLINE_PACK_ENABLED", true);
}
