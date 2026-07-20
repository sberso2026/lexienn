import type { LanguageOptionDefinition } from "@/lib/languages/languageOptions";
import { LOCAL_DIALECTS_GROUP, NATIONAL_LANGUAGES_GROUP } from "@/lib/languages/languageGrouping";

type Seed = Omit<
  LanguageOptionDefinition,
  "locale_tag" | "display_label" | "bcp_47_tag" | "iso_639_code" | "base_language" | "value"
> & {
  value: string;
  display_name: string;
  native_name: string;
  region_group: string;
  country_or_regions: string;
  bcp_47_tag?: string;
};

function national(seed: Seed): LanguageOptionDefinition {
  return {
    value: seed.value,
    display_name: seed.display_name,
    native_name: seed.native_name,
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: seed.country_or_regions,
    iso_639_code: seed.value,
    bcp_47_tag: seed.bcp_47_tag ?? seed.value,
    base_language: seed.value,
    locale_tag: seed.bcp_47_tag ?? seed.value,
    display_label: seed.display_name,
    supports_translation: true,
    supports_voice: seed.supports_voice ?? true,
    supports_offline_pack: seed.supports_offline_pack ?? true,
    supports_ocr: true,
    supports_speech_input: seed.supports_speech_input ?? true,
  };
}

function dialect(seed: Seed & { dialect_label?: string }): LanguageOptionDefinition {
  return {
    ...national({ ...seed, region_group: LOCAL_DIALECTS_GROUP }),
    region_group: LOCAL_DIALECTS_GROUP,
    dialect_label: seed.dialect_label,
    display_label: seed.dialect_label
      ? `${seed.display_name} (${seed.dialect_label})`
      : seed.display_name,
  };
}

/** Additional European national languages for Batch 49. */
export const EUROPEAN_NATIONAL_LANGUAGE_DEFINITIONS: LanguageOptionDefinition[] = [
  national({
    value: "ga",
    display_name: "Irish",
    native_name: "Gaeilge",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "Ireland",
    bcp_47_tag: "ga-IE",
  }),
  national({
    value: "sq",
    display_name: "Albanian",
    native_name: "Shqip",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "Albania, Kosovo",
    bcp_47_tag: "sq-AL",
  }),
  national({
    value: "be",
    display_name: "Belarusian",
    native_name: "Беларуская",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "Belarus",
    bcp_47_tag: "be-BY",
  }),
  national({
    value: "bs",
    display_name: "Bosnian",
    native_name: "Bosanski",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "Bosnia and Herzegovina",
    bcp_47_tag: "bs-BA",
  }),
  national({
    value: "et",
    display_name: "Estonian",
    native_name: "Eesti",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "Estonia",
    bcp_47_tag: "et-EE",
  }),
  national({
    value: "is",
    display_name: "Icelandic",
    native_name: "Íslenska",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "Iceland",
    bcp_47_tag: "is-IS",
  }),
  national({
    value: "lv",
    display_name: "Latvian",
    native_name: "Latviešu",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "Latvia",
    bcp_47_tag: "lv-LV",
  }),
  national({
    value: "lt",
    display_name: "Lithuanian",
    native_name: "Lietuvių",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "Lithuania",
    bcp_47_tag: "lt-LT",
  }),
  national({
    value: "mk",
    display_name: "Macedonian",
    native_name: "Македонски",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "North Macedonia",
    bcp_47_tag: "mk-MK",
  }),
  national({
    value: "mt",
    display_name: "Maltese",
    native_name: "Malti",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "Malta",
    bcp_47_tag: "mt-MT",
  }),
  national({
    value: "sl",
    display_name: "Slovenian",
    native_name: "Slovenščina",
    region_group: NATIONAL_LANGUAGES_GROUP,
    country_or_regions: "Slovenia",
    bcp_47_tag: "sl-SI",
  }),
].sort((a, b) => a.display_name.localeCompare(b.display_name));

/** Regional / local dialect languages for Batch 49. */
export const LOCAL_DIALECT_LANGUAGE_DEFINITIONS: LanguageOptionDefinition[] = [
  dialect({
    value: "pam",
    display_name: "Kapampangan",
    native_name: "Kapampangan",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Philippines (Pampanga)",
    bcp_47_tag: "pam-PH",
  }),
  dialect({
    value: "pag",
    display_name: "Pangasinan",
    native_name: "Pangasinan",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Philippines (Pangasinan)",
    bcp_47_tag: "pag-PH",
  }),
  dialect({
    value: "bcl",
    display_name: "Bicolano",
    native_name: "Bikol",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Philippines (Bicol)",
    bcp_47_tag: "bcl-PH",
  }),
  dialect({
    value: "cbk",
    display_name: "Chavacano",
    native_name: "Chavacano",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Philippines (Zamboanga)",
    bcp_47_tag: "cbk-PH",
  }),
  dialect({
    value: "ca",
    display_name: "Catalan",
    native_name: "Català",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Spain, Andorra",
    bcp_47_tag: "ca-ES",
  }),
  dialect({
    value: "eu",
    display_name: "Basque",
    native_name: "Euskara",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Spain, France",
    bcp_47_tag: "eu-ES",
  }),
  dialect({
    value: "gl",
    display_name: "Galician",
    native_name: "Galego",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Spain (Galicia)",
    bcp_47_tag: "gl-ES",
  }),
  dialect({
    value: "cy",
    display_name: "Welsh",
    native_name: "Cymraeg",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Wales",
    bcp_47_tag: "cy-GB",
  }),
  dialect({
    value: "gd",
    display_name: "Scottish Gaelic",
    native_name: "Gàidhlig",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Scotland",
    bcp_47_tag: "gd-GB",
  }),
  dialect({
    value: "br",
    display_name: "Breton",
    native_name: "Brezhoneg",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "France (Brittany)",
    bcp_47_tag: "br-FR",
    supports_voice: false,
  }),
  dialect({
    value: "co",
    display_name: "Corsican",
    native_name: "Corsu",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "France (Corsica)",
    bcp_47_tag: "co-FR",
    supports_voice: false,
  }),
  dialect({
    value: "sc",
    display_name: "Sardinian",
    native_name: "Sardu",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Italy (Sardinia)",
    bcp_47_tag: "sc-IT",
    supports_voice: false,
  }),
  dialect({
    value: "scn",
    display_name: "Sicilian",
    native_name: "Sicilianu",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Italy (Sicily)",
    bcp_47_tag: "scn-IT",
    supports_voice: false,
  }),
  dialect({
    value: "fy",
    display_name: "Frisian",
    native_name: "Frysk",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Netherlands",
    bcp_47_tag: "fy-NL",
  }),
  dialect({
    value: "lb",
    display_name: "Luxembourgish",
    native_name: "Lëtzebuergesch",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Luxembourg",
    bcp_47_tag: "lb-LU",
  }),
  dialect({
    value: "fo",
    display_name: "Faroese",
    native_name: "Føroyskt",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Faroe Islands",
    bcp_47_tag: "fo-FO",
  }),
  dialect({
    value: "rom",
    display_name: "Romani",
    native_name: "Romani",
    region_group: LOCAL_DIALECTS_GROUP,
    country_or_regions: "Europe",
    bcp_47_tag: "rom",
    supports_voice: false,
    supports_offline_pack: false,
  }),
].sort((a, b) => a.display_name.localeCompare(b.display_name));
