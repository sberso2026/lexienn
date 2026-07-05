import type { LanguageOptionDefinition } from "@/lib/languages/languageOptions";
import {
  BLAAN_NO_INVENTION_RULES,
  buildBlaanVerifiedReferencePromptBlock,
} from "@/lib/languages/blaanVerifiedPhrases";

export const PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP = "Philippine Indigenous Languages";

export const BLAAN_LANGUAGE_CODE = "bli";

export const BLAAN_TRANSLATION_RULES =
  "B'laan is an indigenous language of South Cotabato and Sarangani, distinct from Filipino, Tagalog, Cebuano, Bisaya, Hiligaynon, and other Philippine lingua francas. translated_text MUST be in B'laan for the selected regional variety. Do NOT use Tagalog/Filipino/Cebuano/Bisaya wording or grammar, and do NOT guess from neighboring languages.";

export { BLAAN_NO_INVENTION_RULES, buildBlaanVerifiedReferencePromptBlock };

type PhilippineIndigenousLanguageSeed = Omit<
  LanguageOptionDefinition,
  "locale_tag" | "display_label"
>;

/** Base B'laan entry — regional Koronadal/Sarangani variants are separate dialect selections. */
export const PHILIPPINE_INDIGENOUS_LANGUAGE_DEFINITIONS: PhilippineIndigenousLanguageSeed[] =
  [
    {
      value: "bli",
      display_name: "B'laan",
      native_name: "B'laan",
      region_group: PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP,
      country_or_regions: "South Cotabato & Sarangani, Mindanao",
      iso_639_code: "bli",
      bcp_47_tag: "bli-PH",
      base_language: "bli",
      supports_translation: true,
      supports_voice: true,
      supports_offline_pack: true,
    },
  ];

export const PHILIPPINE_INDIGENOUS_DIALECT_LANGUAGE_IDS = new Set(["lang-bli"]);

export function isBlaanTarget(request: {
  target_language?: string;
  target_language_selection?: string;
  target_dialect?: string;
}): boolean {
  if (request.target_language === BLAAN_LANGUAGE_CODE) return true;
  if (request.target_language_selection?.startsWith(`${BLAAN_LANGUAGE_CODE}::`)) return true;
  if (request.target_dialect?.startsWith("dialect-blaan-")) return true;
  return false;
}
