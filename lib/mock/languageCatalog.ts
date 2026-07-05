import type { Language } from "@/lib/schemas";
import { mockLanguages } from "./languages";

export {
  AFRICAN_LANGUAGES_GROUP,
  encodeLanguageSelection,
  getAfricanLanguageOptions,
  getFlatLanguageSelectOptions,
  getLanguageSelectGroups,
  resolveLanguageSelection,
} from "@/lib/languages/languageOptions";

export type {
  LanguageSelectGroup,
  LanguageSelectOption,
  ResolvedLanguageSelection,
} from "@/lib/languages/languageOptions";

/** @deprecated Use resolveLanguageSelection instead. */
export const LANGUAGE_VARIANT_PARENT: Partial<Record<string, string>> = {
  ceb: "tl",
  hil: "tl",
  ilo: "tl",
  war: "tl",
  yue: "zh",
  egy: "ar",
};

export function getParentLanguageCode(code: string): string {
  return LANGUAGE_VARIANT_PARENT[code] ?? code.split("::")[0]?.split("-")[0] ?? code;
}

export function getLanguagesSortedAlphabetically(): Language[] {
  return [...mockLanguages].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}
