const STORAGE_KEY = "lexienn_translator_settings";

export type TranslatorSettings = {
  ai_translation_enabled: boolean;
  rule_fallback_enabled: boolean;
};

export const DEFAULT_TRANSLATOR_SETTINGS: TranslatorSettings = {
  ai_translation_enabled: true,
  rule_fallback_enabled: true,
};

export function loadTranslatorSettings(): TranslatorSettings {
  if (typeof window === "undefined") return DEFAULT_TRANSLATOR_SETTINGS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TRANSLATOR_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<TranslatorSettings>;
    return {
      ai_translation_enabled:
        parsed.ai_translation_enabled ?? DEFAULT_TRANSLATOR_SETTINGS.ai_translation_enabled,
      rule_fallback_enabled:
        parsed.rule_fallback_enabled ?? DEFAULT_TRANSLATOR_SETTINGS.rule_fallback_enabled,
    };
  } catch {
    return DEFAULT_TRANSLATOR_SETTINGS;
  }
}

export function saveTranslatorSettings(settings: TranslatorSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
