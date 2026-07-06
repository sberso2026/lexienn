import { dictionaryQuerySchema, type DictionaryQuery } from "@/lib/schemas";
import type { UserPreferences } from "@/lib/settings/userPreferences";
import {
  buildTranslationTargetPayload,
  resolveLanguageSelection,
} from "@/lib/languages/languageOptions";

const FILIPINO_ALIASES = new Set(["fil", "filipino", "tagalog", "filipino / tagalog"]);

/** Normalize dictionary target language codes from URL or settings. */
export function normalizeDictionaryLanguageCode(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "en";
  const lower = trimmed.toLowerCase();
  if (FILIPINO_ALIASES.has(lower)) return "tl";
  if (lower.includes("::")) {
    return resolveLanguageSelection(lower).base_language;
  }
  return lower;
}

export type DictionaryQueryParamDefaults = Pick<
  UserPreferences,
  | "default_source_language"
  | "default_target_language"
  | "default_user_context"
  | "default_explanation_level"
>;

export function buildDictionaryQueryFromSearchParams(
  params: URLSearchParams,
  defaults?: DictionaryQueryParamDefaults,
): DictionaryQuery | null {
  const input = params.get("input")?.trim();
  if (!input) return null;

  const sourceRaw = params.get("source") ?? defaults?.default_source_language ?? "en";
  const targetRaw = params.get("target") ?? defaults?.default_target_language ?? "tl";
  const source = normalizeDictionaryLanguageCode(sourceRaw);
  const targetSelection = targetRaw.includes("::")
    ? targetRaw
    : normalizeDictionaryLanguageCode(targetRaw);

  const targetFields = buildTranslationTargetPayload(targetSelection);

  const contextParam = params.get("context");
  const levelParam = params.get("level");
  const modeParam = params.get("mode");

  const parsed = dictionaryQuerySchema.safeParse({
    input_text: input,
    source_language: source,
    target_language: targetFields.target_language,
    target_dialect: targetFields.target_dialect,
    target_language_selection: targetFields.target_language_selection,
    target_locale_tag: targetFields.target_locale_tag,
    target_dialect_label: targetFields.target_dialect_label,
    user_context: contextParam ?? defaults?.default_user_context ?? "general",
    explanation_level: levelParam ?? defaults?.default_explanation_level ?? "normal",
    output_mode: modeParam ?? "explain_and_translate",
  });

  return parsed.success ? parsed.data : null;
}
