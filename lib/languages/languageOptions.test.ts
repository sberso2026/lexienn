import { describe, expect, it } from "vitest";
import {
  AFRICAN_LANGUAGES_GROUP,
  AUSTRALIAN_LANGUAGES_GROUP,
  buildTranslationTargetPayload,
  buildVoiceInstruction,
  getAfricanLanguageOptions,
  getAustralianLanguageOptions,
  getLanguageSelectGroups,
  isAustralianEnglishTarget,
  isIndigenousAustralianTarget,
  LOCAL_DIALECTS_GROUP,
  NATIONAL_LANGUAGES_GROUP,
  resolveLanguageSelection,
} from "@/lib/languages/languageOptions";
import { getBcp47Lang } from "@/lib/audio/speechSynthesis";

describe("languageOptions", () => {
  it("selector groups are National Languages and Local Dialects only", () => {
    const labels = getLanguageSelectGroups().map((group) => group.label);
    expect(labels).toEqual([NATIONAL_LANGUAGES_GROUP, LOCAL_DIALECTS_GROUP]);
  });

  it("includes African languages alphabetically in the catalog helpers", () => {
    const names = getAfricanLanguageOptions().map((option) => option.display_name);
    const sorted = [...names].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(names).toEqual(sorted);
    expect(names.length).toBeGreaterThanOrEqual(26);
    expect(names).toEqual(
      expect.arrayContaining([
        "Afrikaans",
        "Hausa",
        "Igbo",
        "Swahili",
        "Yoruba",
        "Zulu",
        "Amharic",
      ]),
    );
  });

  it("resolves dialect variants from combined selection values", () => {
    const resolved = resolveLanguageSelection("tl::dialect-tl-manila");
    expect(resolved.base_language).toBe("tl");
    expect(resolved.dialect_variant).toBe("dialect-tl-manila");
    expect(resolved.dialect_label).toBeTruthy();
  });

  it("builds local-speaker voice instructions with locale and dialect metadata", () => {
    const resolved = resolveLanguageSelection("sw");
    const instruction = buildVoiceInstruction(resolved);
    expect(instruction).toContain("Speak naturally as a local speaker");
    expect(instruction).toContain("sw-KE");
  });

  it("includes Australian languages alphabetically in catalog helpers", () => {
    const names = getAustralianLanguageOptions().map((option) => option.display_name);
    const sorted = [...names].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(names).toEqual(sorted);
    expect(names.length).toBeGreaterThanOrEqual(15);
    expect(names).toEqual(
      expect.arrayContaining([
        "English (Australia)",
        "Warlpiri",
        "Pitjantjatjara",
      ]),
    );
  });

  it("maps Australian English and indigenous targets", () => {
    expect(isAustralianEnglishTarget({ target_language_selection: "en-au" })).toBe(true);
    expect(isIndigenousAustralianTarget({ target_language_selection: "wbp" })).toBe(true);
    expect(getBcp47Lang("en-au")).toBe("en-AU");
    expect(AFRICAN_LANGUAGES_GROUP).toBe("African Languages");
    expect(AUSTRALIAN_LANGUAGES_GROUP).toBe("Australian Languages");
  });

  it("places dialect selections under Local Dialects", () => {
    const local = getLanguageSelectGroups().find((group) => group.label === LOCAL_DIALECTS_GROUP);
    expect(local?.options.some((option) => option.value.includes("::"))).toBe(true);
  });

  it("buildTranslationTargetPayload retains dialect metadata", () => {
    const payload = buildTranslationTargetPayload("tl::dialect-tl-manila");
    expect(payload.target_language).toBe("tl");
    expect(payload.target_dialect).toBe("dialect-tl-manila");
  });
});
