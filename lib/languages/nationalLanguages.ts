import type { LanguageOptionDefinition } from "@/lib/languages/languageOptions";
import { NATIONAL_LANGUAGES_GROUP } from "@/lib/languages/languageGrouping";

export type NationalLanguageSeed = Omit<
  LanguageOptionDefinition,
  "locale_tag" | "display_label" | "search_text"
> & {
  aliases?: string[];
};

/**
 * Additional national-language catalog entries (Batch 51A).
 * Māori (te reo Māori) — New Zealand / Aotearoa.
 * Offline pack marked false until a pack is shipped.
 */
export const NATIONAL_LANGUAGE_DEFINITIONS: NationalLanguageSeed[] = [
  {
    value: "mi",
    display_name: "Māori",
    native_name: "te reo Māori",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "New Zealand / Aotearoa",
    iso_639_code: "mi",
    bcp_47_tag: "mi-NZ",
    base_language: "mi",
    aliases: [
      "Maori",
      "Te Reo",
      "Te Reo Māori",
      "Te Reo Maori",
      "te reo",
      "mi-NZ",
      "Oceania",
    ],
    supports_translation: true,
    supports_voice: true,
    supports_offline_pack: false,
    supports_ocr: true,
    supports_speech_input: true,
  },
];

export function isMaoriLanguageCode(code: string): boolean {
  const normalized = code.trim().toLowerCase();
  return (
    normalized === "mi" ||
    normalized === "mi-nz" ||
    normalized.startsWith("mi::") ||
    normalized === "mao" ||
    normalized === "mri"
  );
}

export function getMaoriLanguageDefinition(): NationalLanguageSeed {
  return NATIONAL_LANGUAGE_DEFINITIONS[0]!;
}
