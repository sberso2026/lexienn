export const NATIONAL_LANGUAGES_GROUP = "National Languages";
export const LOCAL_DIALECTS_GROUP = "Local Dialects";

export type LanguageSelectorGroup =
  | typeof NATIONAL_LANGUAGES_GROUP
  | typeof LOCAL_DIALECTS_GROUP;

/** Codes that always appear under Local Dialects (regional / variety languages). */
export const LOCAL_DIALECT_BASE_CODES = new Set([
  "ceb",
  "hil",
  "ilo",
  "war",
  "bli",
  "pam",
  "pag",
  "bcl",
  "cbk",
  "egy",
  "yue",
  "en-au",
  "ar-ma",
  "ar-sd",
  "ca",
  "eu",
  "gl",
  "cy",
  "gd",
  "br",
  "co",
  "sc",
  "scn",
  "fy",
  "lb",
  "fo",
  "rom",
  // Australian Indigenous
  "aer",
  "aly",
  "aoi",
  "bdy",
  "gup",
  "zku",
  "rop",
  "mwf",
  "pjt",
  "tcs",
  "tiw",
  "wbp",
  "wrh",
  "yol",
]);

export const LANGUAGE_SEARCH_ALIASES: Record<string, string[]> = {
  fa: ["farsi", "persian", "پارسی"],
  az: ["azeri", "azerbaijani"],
  tl: ["tagalog", "filipino", "pilipino"],
  ceb: ["bisaya", "cebuano", "visayan"],
  hil: ["ilonggo", "hiligaynon"],
  ilo: ["ilocano", "ilokano"],
  ga: ["gaeilge", "irish", "irish gaelic"],
  cy: ["cymraeg", "welsh"],
  gd: ["scottish gaelic", "gaelic"],
  eu: ["euskara", "basque"],
  ca: ["català", "catalan"],
  he: ["ivrit", "hebrew"],
  ur: ["اردو", "urdu"],
  zh: ["mandarin", "chinese"],
  yue: ["cantonese", "粤语"],
  pam: ["kapampangan", "pampango"],
  bcl: ["bicolano", "bikol"],
  cbk: ["chavacano", "chabacano"],
};

export function resolveSelectorGroup(options: {
  value: string;
  base_language: string;
  dialect_variant?: string;
  dialect_label?: string;
}): LanguageSelectorGroup {
  if (options.dialect_variant || options.value.includes("::")) {
    return LOCAL_DIALECTS_GROUP;
  }
  const base = options.base_language.toLowerCase();
  const value = options.value.toLowerCase();
  if (LOCAL_DIALECT_BASE_CODES.has(base) || LOCAL_DIALECT_BASE_CODES.has(value)) {
    return LOCAL_DIALECTS_GROUP;
  }
  return NATIONAL_LANGUAGES_GROUP;
}
