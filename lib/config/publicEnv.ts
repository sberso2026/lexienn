/**
 * Public (browser-safe) feature flags. Never read secrets here.
 */
export function isDeveloperModeFeatureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_DEVELOPER_MODE === "true";
}

/** Spoken Auto Detect for Translate From (Batch 51B). Default on. */
export function isAutomaticLanguageDetectionEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_AUTO_LANGUAGE_DETECT;
  if (raw == null || raw.trim() === "") return true;
  return raw.trim().toLowerCase() !== "false";
}

export {
  isAdvancedLearningEnabled,
  isConversationEnabled,
  isLiveLensOverlayEnabled,
  isSmartOfflinePackEnabled,
  isVisualObjectUnderstandingEnabled,
} from "@/lib/config/featureFlags";
