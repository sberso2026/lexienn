import { isDeveloperModeFeatureEnabled } from "@/lib/config/publicEnv";
import type { ExplanationLevel, UserContext } from "@/lib/schemas";
import type { TranslationMode } from "@/lib/translator/translatorSchemas";
import {
  DEFAULT_TRANSLATOR_SETTINGS,
  loadTranslatorSettings,
  saveTranslatorSettings,
  type TranslatorSettings,
} from "@/lib/storage/translatorSettingsStorage";

export const USER_PREFERENCES_STORAGE_KEY = "lexienn_user_preferences";
export const USER_PREFERENCES_UPDATED_EVENT = "lexienn-preferences-updated";

export type UserPreferences = {
  default_source_language: string;
  default_target_language: string;
  default_user_context: UserContext;
  default_explanation_level: ExplanationLevel;
  default_translation_mode: TranslationMode;
  ai_translation_enabled: boolean;
  rule_fallback_enabled: boolean;
  developer_mode_enabled: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  default_source_language: "en",
  default_target_language: "tl",
  default_user_context: "general",
  default_explanation_level: "normal",
  default_translation_mode: "natural",
  ai_translation_enabled: DEFAULT_TRANSLATOR_SETTINGS.ai_translation_enabled,
  rule_fallback_enabled: DEFAULT_TRANSLATOR_SETTINGS.rule_fallback_enabled,
  developer_mode_enabled: false,
};

function mergeWithTranslatorSettings(
  parsed: Partial<UserPreferences>,
): UserPreferences {
  const engine = loadTranslatorSettings();
  return {
    default_source_language:
      parsed.default_source_language ?? DEFAULT_USER_PREFERENCES.default_source_language,
    default_target_language:
      parsed.default_target_language ?? DEFAULT_USER_PREFERENCES.default_target_language,
    default_user_context:
      parsed.default_user_context ?? DEFAULT_USER_PREFERENCES.default_user_context,
    default_explanation_level:
      parsed.default_explanation_level ?? DEFAULT_USER_PREFERENCES.default_explanation_level,
    default_translation_mode:
      parsed.default_translation_mode ?? DEFAULT_USER_PREFERENCES.default_translation_mode,
    ai_translation_enabled:
      parsed.ai_translation_enabled ?? engine.ai_translation_enabled,
    rule_fallback_enabled:
      parsed.rule_fallback_enabled ?? engine.rule_fallback_enabled,
    developer_mode_enabled: isDeveloperModeFeatureEnabled()
      ? (parsed.developer_mode_enabled ?? DEFAULT_USER_PREFERENCES.developer_mode_enabled)
      : false,
  };
}

function getPreferencesStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function loadUserPreferences(): UserPreferences {
  const storage = getPreferencesStorage();
  if (!storage) return DEFAULT_USER_PREFERENCES;

  try {
    const raw = storage.getItem(USER_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return mergeWithTranslatorSettings({});
    }
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return mergeWithTranslatorSettings(parsed);
  } catch {
    return mergeWithTranslatorSettings({});
  }
}

export function saveUserPreferences(
  patch: Partial<UserPreferences>,
): UserPreferences {
  const sanitizedPatch = { ...patch };
  if (!isDeveloperModeFeatureEnabled()) {
    sanitizedPatch.developer_mode_enabled = false;
  }
  const next = { ...loadUserPreferences(), ...sanitizedPatch };
  const storage = getPreferencesStorage();
  if (storage) {
    storage.setItem(USER_PREFERENCES_STORAGE_KEY, JSON.stringify(next));
    saveTranslatorSettings({
      ai_translation_enabled: next.ai_translation_enabled,
      rule_fallback_enabled: next.rule_fallback_enabled,
    } satisfies TranslatorSettings);
    window.dispatchEvent(new Event(USER_PREFERENCES_UPDATED_EVENT));
  }
  return next;
}

export function notifyUserPreferencesUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(USER_PREFERENCES_UPDATED_EVENT));
}

export function hasSavedUserPreferences(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(USER_PREFERENCES_STORAGE_KEY) !== null;
}

/** Returns Settings defaults only when the user has saved preferences. */
export function getOfflineDefaultLanguages(): { from: string; to: string } | null {
  if (!hasSavedUserPreferences()) return null;
  const prefs = loadUserPreferences();
  return {
    from: prefs.default_source_language,
    to: prefs.default_target_language,
  };
}
