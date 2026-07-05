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
  resolveLanguageSelection,
} from "@/lib/languages/languageOptions";
import { getBcp47Lang } from "@/lib/audio/speechSynthesis";

describe("languageOptions", () => {
  it("includes African Languages group with alphabetically sorted entries", () => {
    const africanGroup = getLanguageSelectGroups().find(
      (group) => group.label === AFRICAN_LANGUAGES_GROUP,
    );

    expect(africanGroup).toBeTruthy();
    const labels = africanGroup?.options.map((option) => option.label) ?? [];
    const sorted = [...labels].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(labels).toEqual(sorted);
    expect(labels.length).toBeGreaterThanOrEqual(26);
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

  it("includes required African languages", () => {
    const names = getAfricanLanguageOptions().map((option) => option.display_name);
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

  it("includes Australian Languages group with alphabetically sorted entries", () => {
    const australianGroup = getLanguageSelectGroups().find(
      (group) => group.label === AUSTRALIAN_LANGUAGES_GROUP,
    );

    expect(australianGroup).toBeTruthy();
    const labels = australianGroup?.options.map((option) => option.label) ?? [];
    const sorted = [...labels].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(labels).toEqual(sorted);
    expect(labels.length).toBeGreaterThanOrEqual(15);
  });

  it("includes required Australian and Aboriginal languages", () => {
    const names = getAustralianLanguageOptions().map((option) => option.display_name);
    expect(names).toEqual(
      expect.arrayContaining([
        "English (Australia)",
        "Warlpiri",
        "Pitjantjatjara",
        "Yolngu Matha",
        "Kaurna",
        "Wiradjuri",
      ]),
    );
  });

  it("resolves Australian English with en-AU locale", () => {
    const resolved = resolveLanguageSelection("en-au");
    expect(resolved.base_language).toBe("en");
    expect(resolved.dialect_label).toBe("Australian English");
    expect(resolved.locale_tag).toBe("en-AU");
    expect(getBcp47Lang("en-au")).toBe("en-AU");
  });

  it("builds translation payload with Australian English metadata", () => {
    const payload = buildTranslationTargetPayload("en-au");
    expect(payload.target_language).toBe("en");
    expect(payload.target_language_selection).toBe("en-au");
    expect(payload.target_locale_tag).toBe("en-AU");
    expect(payload.target_dialect_label).toBe("Australian English");
    expect(payload.target_display_name).toContain("Australia");
    expect(isAustralianEnglishTarget(payload)).toBe(true);
  });

  it("builds translation payload with Wiradjuri display name", () => {
    const payload = buildTranslationTargetPayload("wrh");
    expect(payload.target_language).toBe("wrh");
    expect(payload.target_display_name).toBe("Wiradjuri");
    expect(isIndigenousAustralianTarget(payload)).toBe(true);
  });

  it("adds indigenous voice guidance without Chinese accent instructions for English", () => {
    const resolved = resolveLanguageSelection("wbp");
    const instruction = buildVoiceInstruction(resolved);
    expect(instruction).toContain("Indigenous Australian");
    expect(instruction).toContain("Do not use Chinese");
  });
});
