import { describe, expect, it } from "vitest";
import {
  AI_TRANSLATION_GUARDRAIL_MARKERS,
  buildTranslationPrompt,
} from "@/lib/translator/translationPrompt";
import {
  isLikelyEnglishRewrite,
  isValidTargetLanguageOutput,
  requiresNonEnglishTranslationOutput,
} from "@/lib/translator/translationTargetValidation";
import type { TranslatorRequest } from "@/lib/translator/translatorSchemas";

const baseRequest: TranslatorRequest = {
  input_text: "I need flip-flops for the beach.",
  source_language: "en",
  target_language: "en",
  user_context: "general",
  translation_mode: "natural",
  ai_translation_enabled: true,
  rule_fallback_enabled: true,
};

describe("buildTranslationPrompt", () => {
  it("includes Australian English vocabulary rules for en-au targets", () => {
    const { system } = buildTranslationPrompt({
      ...baseRequest,
      target_language_selection: "en-au",
      target_locale_tag: "en-AU",
      target_dialect_label: "Australian English",
      target_display_name: "English (Australia) (Australian English)",
    });

    expect(system).toContain(AI_TRANSLATION_GUARDRAIL_MARKERS.australianEnglish);
    expect(system).toContain("thongs");
    expect(system).not.toContain(
      "Return the same sentence or a simpler/more polite English rewrite",
    );
  });

  it("requires Indigenous Australian output for Wiradjuri targets", () => {
    const { system } = buildTranslationPrompt({
      ...baseRequest,
      input_text: "I want to go to the park.",
      target_language: "wrh",
      target_language_selection: "wrh",
      target_locale_tag: "wrh-AU",
      target_display_name: "Wiradjuri",
      translation_mode: "simple",
    });

    expect(system).toContain(AI_TRANSLATION_GUARDRAIL_MARKERS.indigenousAustralian);
    expect(system).toContain("Wiradjuri");
    expect(system).toContain(AI_TRANSLATION_GUARDRAIL_MARKERS.noEnglishFallback);
    expect(system).not.toContain(
      "Return the same sentence or a simpler/more polite English rewrite",
    );
  });

  it("requires B'laan output for Koronadal B'laan without Tagalog fallback", () => {
    const { system } = buildTranslationPrompt({
      ...baseRequest,
      input_text: "I want to go to the park.",
      target_language: "bli",
      target_language_selection: "bli::dialect-blaan-koronadal",
      target_dialect: "dialect-blaan-koronadal",
      target_locale_tag: "bli-PH",
      target_dialect_label: "Koronadal B'laan",
      target_display_name: "B'laan (Koronadal B'laan)",
    });

    expect(system).toContain(AI_TRANSLATION_GUARDRAIL_MARKERS.blaan);
    expect(system).toContain(AI_TRANSLATION_GUARDRAIL_MARKERS.noTagalogFallback);
    expect(system).toContain(AI_TRANSLATION_GUARDRAIL_MARKERS.verifiedBlaanOnly);
    expect(system).toContain("Fetew le ngipen nu");
    expect(system).toContain("Koronadal B'laan");
    expect(system).not.toMatch(/Filipino \/ Tagalog/);
  });

  it("keeps generic English-to-English rewrite guidance for non-Australian English", () => {
    const { system } = buildTranslationPrompt(baseRequest);

    expect(system).toContain(
      "Return the same sentence or a simpler/more polite English rewrite",
    );
    expect(system).not.toContain('Use "thongs" for flip-flop footwear');
  });
});

describe("translationTargetValidation", () => {
  it("detects English rewrites for Indigenous targets", () => {
    const request: TranslatorRequest = {
      ...baseRequest,
      input_text: "I want to go to the park.",
      target_language: "wrh",
      target_language_selection: "wrh",
      target_display_name: "Wiradjuri",
    };

    expect(requiresNonEnglishTranslationOutput(request)).toBe(true);
    expect(isLikelyEnglishRewrite(request.input_text, "I wanna go to the park.")).toBe(true);
    expect(
      isValidTargetLanguageOutput(request, {
        translated_text: "I wanna go to the park.",
        natural_translation: "I wanna go to the park.",
      }),
    ).toBe(false);
  });

  it("accepts distinct target-language output", () => {
    const request: TranslatorRequest = {
      ...baseRequest,
      input_text: "I want to go to the park.",
      target_language: "tcs",
      target_language_selection: "tcs",
      target_display_name: "Torres Strait Creole",
    };

    expect(
      isValidTargetLanguageOutput(request, {
        translated_text: "Ai laik go long ples.",
        natural_translation: "Ai laik go long ples.",
      }),
    ).toBe(true);
  });
});
