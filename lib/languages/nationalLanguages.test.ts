import { describe, expect, it } from "vitest";
import {
  filterLanguageOptions,
  getLanguageOptionByValue,
  getLanguageSelectGroups,
  NATIONAL_LANGUAGES_GROUP,
  LOCAL_DIALECTS_GROUP,
  buildTranslationTargetPayload,
  buildVoiceInstruction,
  resolveLanguageSelection,
} from "@/lib/languages/languageOptions";
import { foldMaoriMacronsForSearch } from "@/lib/text/normalizeLookupText";
import {
  NATIONAL_LANGUAGE_DEFINITIONS,
  isMaoriLanguageCode,
} from "@/lib/languages/nationalLanguages";

describe("Batch 51A Māori language support", () => {
  it("includes Māori under National Languages alphabetically", () => {
    const national = getLanguageSelectGroups().find(
      (group) => group.label === NATIONAL_LANGUAGES_GROUP,
    );
    expect(national).toBeTruthy();
    const labels = national!.options.map((option) => option.label);
    const miIndex = national!.options.findIndex((option) => option.value === "mi");
    expect(miIndex).toBeGreaterThanOrEqual(0);
    expect(labels.some((label) => label.includes("Māori"))).toBe(true);
    const sorted = [...labels].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(labels).toEqual(sorted);
  });

  it("does not place Māori under Local Dialects", () => {
    const local = getLanguageSelectGroups().find((group) => group.label === LOCAL_DIALECTS_GROUP);
    expect(local?.options.some((option) => option.value === "mi")).toBe(false);
  });

  it("finds Māori via alias search queries", () => {
    const queries = ["Māori", "Maori", "te reo Māori", "Te Reo", "mi"];
    for (const query of queries) {
      expect(filterLanguageOptions(query).some((option) => option.value === "mi")).toBe(true);
    }
  });

  it("resolves Māori to mi-NZ locale and translation payload", () => {
    const resolved = resolveLanguageSelection("mi");
    expect(resolved.base_language).toBe("mi");
    expect(resolved.locale_tag).toBe("mi-NZ");
    expect(resolved.display_label).toContain("Māori");
    const payload = buildTranslationTargetPayload("mi");
    expect(payload.target_language).toBe("mi");
    expect(payload.target_locale_tag).toBe("mi-NZ");
    expect(payload.target_display_name).toContain("Māori");
    expect(getLanguageOptionByValue("mi")?.bcp_47_tag).toBe("mi-NZ");
  });

  it("folds macrons for search while preserving display macrons", () => {
    expect(foldMaoriMacronsForSearch("Māori")).toBe("maori");
    expect(getLanguageOptionByValue("mi")?.display_name).toBe("Māori");
    expect(getLanguageOptionByValue("mi")?.native_name).toBe("te reo Māori");
  });

  it("includes respectful Māori voice guidance without claiming native voice", () => {
    const instruction = buildVoiceInstruction(resolveLanguageSelection("mi"));
    expect(instruction).toContain("te reo Māori");
    expect(instruction).toContain("do not claim it is native Māori");
  });

  it("recognizes Māori language codes", () => {
    expect(isMaoriLanguageCode("mi")).toBe(true);
    expect(isMaoriLanguageCode("mi-NZ")).toBe(true);
    expect(NATIONAL_LANGUAGE_DEFINITIONS[0]?.native_name).toBe("te reo Māori");
  });
});
