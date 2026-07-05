import { describe, expect, it } from "vitest";
import {
  findBlaanVerifiedPhrase,
  isLikelyPhilippineLinguaFrancaOutput,
  phraseMatchesInput,
} from "@/lib/languages/blaanVerifiedPhrases";
import { tryBlaanVerifiedTranslation } from "@/lib/translator/blaanVerifiedTranslation";
import { runTranslationPipeline } from "@/lib/translator/translationProviders";
import {
  isValidBlaanTranslationOutput,
  isValidTargetLanguageOutput,
} from "@/lib/translator/translationTargetValidation";
import type { TranslatorRequest } from "@/lib/translator/translatorSchemas";

const baseRequest: TranslatorRequest = {
  input_text: "malaki ang ngipin mo",
  source_language: "tl",
  target_language: "bli",
  target_language_selection: "bli::dialect-blaan-koronadal",
  target_dialect: "dialect-blaan-koronadal",
  target_locale_tag: "bli-PH",
  target_dialect_label: "Koronadal B'laan",
  target_display_name: "B'laan (Koronadal B'laan)",
  user_context: "general",
  translation_mode: "natural",
  ai_translation_enabled: true,
  rule_fallback_enabled: true,
};

describe("blaanVerifiedPhrases", () => {
  it("matches the user-provided Tagalog teeth example", () => {
    const phrase = findBlaanVerifiedPhrase("malaki ang ngipin mo", "dialect-blaan-koronadal");
    expect(phrase?.blaan).toBe("Fetew le ngipen nu");
  });

  it("matches English gloss variants", () => {
    expect(phraseMatchesInput("Your teeth are big", ["your teeth are big"])).toBe(true);
  });

  it("flags Bisaya-like output", () => {
    expect(isLikelyPhilippineLinguaFrancaOutput("Dako kaayo imong ngipon")).toBe(true);
    expect(isLikelyPhilippineLinguaFrancaOutput("Fetew le ngipen nu")).toBe(false);
  });
});

describe("tryBlaanVerifiedTranslation", () => {
  it("returns verified B'laan for the attested Tagalog phrase", () => {
    const result = tryBlaanVerifiedTranslation(baseRequest);
    expect(result?.translated_text).toBe("Fetew le ngipen nu");
    expect(result?.source).toBe("dictionary");
    expect(result?.validation_status).toBe("verified_dictionary");
  });
});

describe("translationTargetValidation for B'laan", () => {
  it("rejects Tagalog and Bisaya-like AI output", () => {
    expect(
      isValidTargetLanguageOutput(baseRequest, {
        translated_text: "Malaki ang ngipin mo",
        natural_translation: "Malaki ang ngipin mo",
      }),
    ).toBe(false);
    expect(
      isValidTargetLanguageOutput(baseRequest, {
        translated_text: "Dako kaayo imong ngipon",
        natural_translation: "Dako kaayo imong ngipon",
      }),
    ).toBe(false);
  });

  it("accepts only verified catalog B'laan output", () => {
    expect(
      isValidBlaanTranslationOutput({
        translated_text: "Fetew le ngipen nu",
        natural_translation: "Fetew le ngipen nu",
      }),
    ).toBe(true);
    expect(
      isValidBlaanTranslationOutput({
        translated_text: "Some invented blaan phrase",
        natural_translation: "Some invented blaan phrase",
      }),
    ).toBe(false);
  });
});

describe("runTranslationPipeline for B'laan", () => {
  it("returns verified translation for attested input and unavailable for unverified input", async () => {
    const verified = await runTranslationPipeline(baseRequest);
    expect(verified.translated_text).toBe("Fetew le ngipen nu");

    const unavailable = await runTranslationPipeline({
      ...baseRequest,
      input_text: "Kumusta ka?",
    });
    expect(unavailable.translated_text).toBe("");
    expect(unavailable.source).toBe("unavailable");
    expect(unavailable.unavailable_reason).toContain("verified B'laan");
  });
});
