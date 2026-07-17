import { mockDialects } from "@/lib/mock/dialects";
import { mockLanguages } from "@/lib/mock/languages";
import { AFRICAN_LANGUAGE_DEFINITIONS } from "@/lib/languages/africanLanguages";
import {
  AUSTRALIAN_LANGUAGE_DEFINITIONS,
  AUSTRALIAN_LANGUAGES_GROUP,
  isAustralianEnglishSelection,
  isAustralianIndigenousLanguageCode,
} from "@/lib/languages/australianLanguages";
import {
  PHILIPPINE_INDIGENOUS_DIALECT_LANGUAGE_IDS,
  PHILIPPINE_INDIGENOUS_LANGUAGE_DEFINITIONS,
  PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP,
} from "@/lib/languages/philippineIndigenousLanguages";
import { getBcp47Lang } from "@/lib/audio/speechSynthesis";

export const AFRICAN_LANGUAGES_GROUP = "African Languages";
export { AUSTRALIAN_LANGUAGES_GROUP, PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP };

export type LanguageOptionDefinition = {
  value: string;
  display_name: string;
  native_name: string;
  region_group: string;
  country_or_regions: string;
  iso_639_code: string;
  bcp_47_tag: string;
  base_language: string;
  dialect_variant?: string;
  dialect_label?: string;
  locale_tag: string;
  display_label: string;
  supports_translation: boolean;
  supports_voice: boolean;
  supports_offline_pack: boolean;
  supports_ocr?: boolean;
  supports_speech_input?: boolean;
};

export type LanguageSelectOption = {
  value: string;
  label: string;
  native_name: string;
  search_text: string;
};

export type LanguageSelectGroup = {
  label: string;
  options: LanguageSelectOption[];
};

export type ResolvedLanguageSelection = {
  selection_value: string;
  base_language: string;
  dialect_variant?: string;
  locale_tag: string;
  display_label: string;
  dialect_label?: string;
  region?: string;
};

const REGION_BY_CODE: Record<string, string> = {
  en: "English & Global",
  tl: "Filipino & Philippine Languages",
  ceb: "Filipino & Philippine Languages",
  hil: "Filipino & Philippine Languages",
  ilo: "Filipino & Philippine Languages",
  war: "Filipino & Philippine Languages",
  bli: PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP,
  id: "Southeast Asian Languages",
  ms: "Southeast Asian Languages",
  es: "European & Americas",
  vi: "Southeast Asian Languages",
  th: "Southeast Asian Languages",
  lo: "Southeast Asian Languages",
  zh: "East Asian Languages",
  yue: "East Asian Languages",
  ja: "East Asian Languages",
  ko: "East Asian Languages",
  fr: "European & Americas",
  de: "European & Americas",
  pt: "European & Americas",
  it: "European & Americas",
  nl: "European & Americas",
  ru: "European & Americas",
  ar: "Middle Eastern Languages",
  egy: "Middle Eastern Languages",
  fa: "Middle Eastern Languages",
  az: "Middle Eastern Languages",
  he: "Middle Eastern Languages",
  ku: "Middle Eastern Languages",
  hy: "Middle Eastern Languages",
  ka: "Middle Eastern Languages",
  ps: "Middle Eastern Languages",
  hi: "South Asian Languages",
  bn: "South Asian Languages",
  ur: "South Asian Languages",
  ne: "South Asian Languages",
  si: "South Asian Languages",
  ta: "South Asian Languages",
  te: "South Asian Languages",
  mr: "South Asian Languages",
  gu: "South Asian Languages",
  pa: "South Asian Languages",
  ml: "South Asian Languages",
  kn: "South Asian Languages",
  tr: "Middle Eastern Languages",
  pl: "European & Americas",
  uk: "European & Americas",
  sv: "European & Americas",
  fi: "European & Americas",
  el: "European & Americas",
  cs: "European & Americas",
  hu: "European & Americas",
  ro: "European & Americas",
  da: "European & Americas",
  no: "European & Americas",
  sk: "European & Americas",
  bg: "European & Americas",
  sr: "European & Americas",
  hr: "European & Americas",
  kk: "Central Asian Languages",
  uz: "Central Asian Languages",
  ht: "European & Americas",
  qu: "European & Americas",
  gn: "European & Americas",
  ay: "European & Americas",
  sw: AFRICAN_LANGUAGES_GROUP,
  am: AFRICAN_LANGUAGES_GROUP,
  yo: AFRICAN_LANGUAGES_GROUP,
  zu: AFRICAN_LANGUAGES_GROUP,
  ha: AFRICAN_LANGUAGES_GROUP,
};

const COUNTRY_BY_CODE: Record<string, string> = {
  en: "Global",
  tl: "Philippines",
  ceb: "Philippines (Cebu)",
  hil: "Philippines (Western Visayas)",
  ilo: "Philippines (Ilocos)",
  war: "Philippines (Eastern Visayas)",
  bli: "South Cotabato & Sarangani, Mindanao",
  id: "Indonesia",
  ms: "Malaysia, Brunei",
  es: "Spain, Latin America",
  vi: "Vietnam",
  th: "Thailand",
  lo: "Laos",
  zh: "China",
  yue: "Hong Kong, Guangdong",
  ja: "Japan",
  ko: "Korea",
  fr: "France, Francophone regions",
  de: "Germany, Austria, Switzerland",
  pt: "Portugal, Brazil",
  it: "Italy",
  nl: "Netherlands, Belgium",
  ru: "Russia",
  ar: "Arab world",
  egy: "Egypt",
  fa: "Iran, Afghanistan, Tajikistan",
  az: "Azerbaijan, Iran",
  he: "Israel",
  ku: "Kurdistan region",
  hy: "Armenia",
  ka: "Georgia",
  ps: "Afghanistan, Pakistan",
  hi: "India",
  bn: "Bangladesh, India",
  ur: "Pakistan, India",
  ne: "Nepal",
  si: "Sri Lanka",
  ta: "India, Sri Lanka",
  te: "India",
  mr: "India",
  gu: "India",
  pa: "India, Pakistan",
  ml: "India",
  kn: "India",
  tr: "Turkey",
  pl: "Poland",
  uk: "Ukraine",
  sv: "Sweden",
  fi: "Finland",
  el: "Greece",
  cs: "Czechia",
  hu: "Hungary",
  ro: "Romania",
  da: "Denmark",
  no: "Norway",
  sk: "Slovakia",
  bg: "Bulgaria",
  sr: "Serbia",
  hr: "Croatia",
  kk: "Kazakhstan",
  uz: "Uzbekistan",
  ht: "Haiti",
  qu: "Peru, Bolivia",
  gn: "Paraguay",
  ay: "Bolivia",
};

function finalizeOption(
  partial: Omit<
    LanguageOptionDefinition,
    "locale_tag" | "display_label" | "search_text"
  > & { value: string; display_name: string; base_language: string },
): LanguageOptionDefinition {
  const locale_tag = partial.bcp_47_tag || getBcp47Lang(partial.base_language);
  const display_label = partial.dialect_label
    ? `${partial.display_name} (${partial.dialect_label})`
    : partial.display_name;

  return {
    ...partial,
    supports_ocr: partial.supports_ocr ?? true,
    supports_speech_input: partial.supports_speech_input ?? true,
    locale_tag,
    display_label,
  };
}

function buildMockLanguageOptions(): LanguageOptionDefinition[] {
  const catalogValues = new Set([
    ...AFRICAN_LANGUAGE_DEFINITIONS.map((item) => item.value),
    ...AUSTRALIAN_LANGUAGE_DEFINITIONS.map((item) => item.value),
    ...PHILIPPINE_INDIGENOUS_LANGUAGE_DEFINITIONS.map((item) => item.value),
  ]);

  return mockLanguages
    .filter((language) => !catalogValues.has(language.code))
    .map((language) =>
      finalizeOption({
        value: language.code,
        display_name: language.name,
        native_name: language.native_name,
        region_group: REGION_BY_CODE[language.code] ?? "Other Languages",
        country_or_regions: COUNTRY_BY_CODE[language.code] ?? "Regional",
        iso_639_code: language.code.split("-")[0],
        bcp_47_tag: getBcp47Lang(language.code),
        base_language: language.code,
        supports_translation: true,
        supports_voice: true,
        supports_offline_pack: true,
      }),
    );
}

function buildAfricanLanguageOptions(): LanguageOptionDefinition[] {
  return AFRICAN_LANGUAGE_DEFINITIONS.map((item) => finalizeOption(item)).sort((a, b) =>
    a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" }),
  );
}

function buildAustralianLanguageOptions(): LanguageOptionDefinition[] {
  return AUSTRALIAN_LANGUAGE_DEFINITIONS.map((item) => finalizeOption(item)).sort((a, b) =>
    a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" }),
  );
}

function buildPhilippineIndigenousLanguageOptions(): LanguageOptionDefinition[] {
  return PHILIPPINE_INDIGENOUS_LANGUAGE_DEFINITIONS.map((item) => finalizeOption(item)).sort(
    (a, b) =>
      a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" }),
  );
}

function buildDialectLanguageOptions(): LanguageOptionDefinition[] {
  return mockDialects.map((dialect) => {
    const parentLanguage = mockLanguages.find((language) => language.id === dialect.language_id);
    const baseLanguage = parentLanguage?.code ?? "tl";
    const isPhilippineIndigenous = PHILIPPINE_INDIGENOUS_DIALECT_LANGUAGE_IDS.has(
      dialect.language_id,
    );

    return finalizeOption({
      value: encodeLanguageSelection(baseLanguage, dialect.id),
      display_name: dialect.name,
      native_name: parentLanguage?.native_name ?? dialect.name,
      region_group: isPhilippineIndigenous
        ? PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP
        : (REGION_BY_CODE[baseLanguage] ?? "Filipino & Philippine Languages"),
      country_or_regions: dialect.region ?? COUNTRY_BY_CODE[baseLanguage] ?? "Regional",
      iso_639_code: baseLanguage,
      bcp_47_tag: isPhilippineIndigenous ? "bli-PH" : getBcp47Lang(baseLanguage),
      base_language: baseLanguage,
      dialect_variant: dialect.id,
      dialect_label: dialect.variant_label,
      supports_translation: true,
      supports_voice: true,
      supports_offline_pack: true,
    });
  });
}

let cachedOptions: LanguageOptionDefinition[] | null = null;

export function getAllLanguageOptions(): LanguageOptionDefinition[] {
  if (cachedOptions) return cachedOptions;

  const byValue = new Map<string, LanguageOptionDefinition>();
  for (const option of [
    ...buildMockLanguageOptions(),
    ...buildAfricanLanguageOptions(),
    ...buildAustralianLanguageOptions(),
    ...buildPhilippineIndigenousLanguageOptions(),
    ...buildDialectLanguageOptions(),
  ]) {
    byValue.set(option.value, option);
  }

  cachedOptions = [...byValue.values()];
  return cachedOptions;
}

export function encodeLanguageSelection(
  baseLanguage: string,
  dialectVariant?: string,
): string {
  return dialectVariant ? `${baseLanguage}::${dialectVariant}` : baseLanguage;
}

export function resolveLanguageSelection(value: string): ResolvedLanguageSelection {
  const option = getLanguageOptionByValue(value);
  if (option) {
    return {
      selection_value: option.value,
      base_language: option.base_language,
      dialect_variant: option.dialect_variant,
      locale_tag: option.locale_tag,
      display_label: option.display_label,
      dialect_label: option.dialect_label,
      region: option.country_or_regions,
    };
  }

  const [baseLanguage, dialectVariant] = value.split("::");
  return {
    selection_value: value,
    base_language: baseLanguage,
    dialect_variant: dialectVariant || undefined,
    locale_tag: getBcp47Lang(baseLanguage),
    display_label: baseLanguage,
    dialect_label: dialectVariant,
  };
}

export function getLanguageOptionByValue(value: string): LanguageOptionDefinition | undefined {
  return getAllLanguageOptions().find((option) => option.value === value);
}

function optionToSelectOption(option: LanguageOptionDefinition): LanguageSelectOption {
  const label =
    option.native_name && option.native_name !== option.display_name
      ? `${option.display_label} — ${option.native_name}`
      : option.display_label;

  return {
    value: option.value,
    label,
    native_name: option.native_name,
    search_text: [
      option.display_name,
      option.display_label,
      option.native_name,
      option.region_group,
      option.country_or_regions,
      option.iso_639_code,
      option.base_language,
      option.dialect_label,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}

export function filterLanguageOptions(query: string): LanguageOptionDefinition[] {
  const normalized = query.trim().toLowerCase();
  const options = getAllLanguageOptions();
  if (!normalized) return options;
  return options.filter((option) => optionToSelectOption(option).search_text.includes(normalized));
}

export function getLanguageSelectGroups(searchQuery = ""): LanguageSelectGroup[] {
  const options = searchQuery ? filterLanguageOptions(searchQuery) : getAllLanguageOptions();
  const grouped = new Map<string, LanguageSelectOption[]>();

  for (const option of options) {
    const groupOptions = grouped.get(option.region_group) ?? [];
    groupOptions.push(optionToSelectOption(option));
    grouped.set(option.region_group, groupOptions);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => {
      if (a === AFRICAN_LANGUAGES_GROUP) return b === AFRICAN_LANGUAGES_GROUP ? 0 : -1;
      if (b === AFRICAN_LANGUAGES_GROUP) return 1;
      if (a === AUSTRALIAN_LANGUAGES_GROUP) return b === AUSTRALIAN_LANGUAGES_GROUP ? 0 : -1;
      if (b === AUSTRALIAN_LANGUAGES_GROUP) return 1;
      if (a === PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP) {
        return b === PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP ? 0 : -1;
      }
      if (b === PHILIPPINE_INDIGENOUS_LANGUAGES_GROUP) return 1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    })
    .map(([label, groupOptions]) => ({
      label,
      options: groupOptions.sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
      ),
    }));
}

export function getFlatLanguageSelectOptions(searchQuery = ""): LanguageSelectOption[] {
  return getLanguageSelectGroups(searchQuery).flatMap((group) => group.options);
}

export function getAustralianLanguageOptions(): LanguageOptionDefinition[] {
  return getAllLanguageOptions()
    .filter((option) => option.region_group === AUSTRALIAN_LANGUAGES_GROUP)
    .sort((a, b) =>
      a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" }),
    );
}

export function getAfricanLanguageOptions(): LanguageOptionDefinition[] {
  return getAllLanguageOptions()
    .filter((option) => option.region_group === AFRICAN_LANGUAGES_GROUP)
    .sort((a, b) =>
      a.display_name.localeCompare(b.display_name, undefined, { sensitivity: "base" }),
    );
}

export const DEFAULT_VOICE_INSTRUCTION =
  "Speak naturally as a local speaker of the selected language or dialect. Use clear conversational pronunciation. Do not exaggerate accent.";

export function isAustralianEnglishTarget(request: {
  target_language_selection?: string;
  target_locale_tag?: string;
  target_dialect_label?: string;
}): boolean {
  return (
    request.target_language_selection === "en-au" ||
    request.target_locale_tag === "en-AU" ||
    request.target_dialect_label === "Australian English"
  );
}

export function isIndigenousAustralianTarget(request: {
  target_language_selection?: string;
}): boolean {
  if (!request.target_language_selection) return false;
  return isAustralianIndigenousLanguageCode(request.target_language_selection);
}

export const INDIGENOUS_AUSTRALIAN_TRANSLATION_RULES =
  "The target is an Indigenous Australian language. translated_text MUST be in that language (romanized where needed). Do NOT return English, simplified English, paraphrased English, or an English rewrite — even for simple or speak_to_local modes. If you cannot produce attested target-language wording, set validation_status to uncertain, lower confidence_score, explain clearly in usage_note, and provide the closest attested target-language phrase you can — never fall back to English.";

export function buildTranslationTargetPayload(selectionValue: string): {
  target_language: string;
  target_dialect?: string;
  target_language_selection: string;
  target_locale_tag: string;
  target_dialect_label?: string;
  target_display_name: string;
} {
  const resolved = resolveLanguageSelection(selectionValue);
  return {
    target_language: resolved.base_language,
    target_dialect: resolved.dialect_variant,
    target_language_selection: resolved.selection_value,
    target_locale_tag: resolved.locale_tag,
    target_dialect_label: resolved.dialect_label,
    target_display_name: resolved.display_label,
  };
}

export const AUSTRALIAN_ENGLISH_VOCABULARY_RULES = [
  "Use Australian English vocabulary, spelling, and phrasing (e.g. colour, organise, arvo, servo, ute, chemist, footpath, boot of a car).",
  'Use "thongs" for flip-flop footwear — not "flip-flops".',
  "Avoid American English wording and spelling unless quoting the source.",
  "Keep phrasing natural for Australian speakers.",
].join(" ");

export function buildVoiceInstruction(selection: ResolvedLanguageSelection): string {
  const parts = [DEFAULT_VOICE_INSTRUCTION];
  parts.push(`Language locale: ${selection.locale_tag}.`);
  if (selection.dialect_label) {
    parts.push(`Dialect: ${selection.dialect_label}.`);
  }
  if (selection.region) {
    parts.push(`Region context: ${selection.region}.`);
  }
  if (isAustralianEnglishSelection(selection.selection_value)) {
    parts.push(
      "Use an Australian English accent. Do not use American or British-only pronunciation when Australian English is expected.",
    );
  }
  if (isAustralianIndigenousLanguageCode(selection.selection_value)) {
    parts.push(
      "This is Indigenous Australian language text (romanized). Read with a clear Australian English voice and respectful local pronunciation.",
    );
    parts.push("Do not use Chinese, Mandarin, Cantonese, Japanese, or Korean accents.");
    parts.push("If pronunciation guidance is provided, follow it closely.");
  }
  if (
    selection.base_language === "bli" ||
    selection.selection_value.startsWith("bli::")
  ) {
    parts.push(
      "This is B'laan, an indigenous language of South Cotabato/Sarangani. Use respectful local pronunciation.",
    );
    parts.push("Do not use Tagalog, Filipino, or Cebuano accent or intonation.");
    parts.push("If pronunciation guidance is provided, follow it closely.");
  }
  return parts.join(" ");
}
