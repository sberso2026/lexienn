import { describe, expect, it } from "vitest";
import { isEnglishToEnglishQuery } from "@/lib/dictionary/normalizeDictionaryEntry";
import { getBcp47Lang } from "@/lib/audio/speechSynthesis";

describe("speechSynthesis voice matching", () => {
  it("maps Polish, Hindi, and new languages to expected BCP-47 tags", () => {
    expect(getBcp47Lang("pl")).toBe("pl-PL");
    expect(getBcp47Lang("hi")).toBe("hi-IN");
    expect(getBcp47Lang("yue")).toBe("zh-HK");
    expect(getBcp47Lang("egy")).toBe("ar-EG");
    expect(getBcp47Lang("lo")).toBe("lo-LA");
    expect(getBcp47Lang("sw")).toBe("sw-KE");
    expect(getBcp47Lang("qu")).toBe("qu-PE");
    expect(getBcp47Lang("en-au")).toBe("en-AU");
    expect(getBcp47Lang("wbp")).toBe("wbp-AU");
  });
});

describe("dictionary English target handling", () => {
  it("treats Australian English as a localization target, not plain English-to-English", () => {
    expect(
      isEnglishToEnglishQuery({
        input_text: "thong",
        source_language: "en",
        target_language: "en",
        target_language_selection: "en-au",
        target_locale_tag: "en-AU",
        target_dialect_label: "Australian English",
        user_context: "general",
        explanation_level: "normal",
        output_mode: "explain_and_translate",
      }),
    ).toBe(false);
  });
});
