import { describe, expect, it } from "vitest";
import { getLanguageByCode, mockLanguages } from "@/lib/mock/languages";
import { getAllLanguageOptions } from "@/lib/languages/languageOptions";

describe("expanded language catalog", () => {
  it("includes Persian and Azerbaijani", () => {
    expect(getLanguageByCode("fa")?.name).toBe("Persian");
    expect(getLanguageByCode("az")?.name).toBe("Azerbaijani");
    expect(getLanguageByCode("fa")?.native_name).toContain("فارسی");
    expect(getLanguageByCode("az")?.native_name).toContain("Azərbaycan");
  });

  it("exposes new languages in searchable select options", () => {
    const values = new Set(getAllLanguageOptions().map((option) => option.value));
    for (const code of ["fa", "az", "ur", "he", "uk", "sv", "ta", "kk"]) {
      expect(values.has(code)).toBe(true);
    }
  });

  it("keeps existing core languages", () => {
    for (const code of ["en", "tl", "ar", "tr", "hi"]) {
      expect(mockLanguages.some((language) => language.code === code)).toBe(true);
    }
  });
});
