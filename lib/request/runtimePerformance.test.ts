import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildDictionaryRequestKey, buildTranslationRequestKey } from "@/lib/request/requestKeys";
import type { DictionaryQuery } from "@/lib/schemas";
import type { TranslatorRequest } from "@/lib/translator/translatorSchemas";

describe("requestKeys", () => {
  it("normalizes translation keys for whitespace and casing", () => {
    const base: TranslatorRequest = {
      input_text: "Hello",
      source_language: "en",
      target_language: "tl",
      user_context: "general",
      translation_mode: "natural",
      ai_translation_enabled: true,
      rule_fallback_enabled: true,
    };

    const a = buildTranslationRequestKey(base);
    const b = buildTranslationRequestKey({ ...base, input_text: "  hello  " });
    expect(a).toBe(b);
  });

  it("builds distinct dictionary keys for different levels", () => {
    const query: DictionaryQuery = {
      input_text: "water",
      source_language: "en",
      target_language: "tl",
      user_context: "general",
      explanation_level: "normal",
      output_mode: "explain_and_translate",
    };

    const normal = buildDictionaryRequestKey(query);
    const advanced = buildDictionaryRequestKey({
      ...query,
      explanation_level: "advanced",
    });
    expect(normal).not.toBe(advanced);
  });
});

describe("runtime performance UX wiring", () => {
  const voiceInput = readFileSync("components/speech/VoiceInputTextArea.tsx", "utf8");
  const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
  const appShell = readFileSync("components/AppShell.tsx", "utf8");
  const launch = readFileSync("lib/launch/shouldShowLaunchScreen.ts", "utf8");

  it("clear button is wired with accessible label", () => {
    expect(voiceInput).toContain('label="Clear previous entry"');
    expect(voiceInput).toContain("showClear");
    expect(voiceInput).toContain("onClear");
    expect(translator).toContain("handleClear");
    expect(translator).toContain("abortActiveRequest");
  });

  it("translator uses active request lifecycle and cache client", () => {
    expect(translator).toContain("buildTranslationRequestKey");
    expect(translator).toContain("isActiveRequest");
    expect(translator).toContain("translateSentenceViaApi");
    expect(translator).not.toContain("disabled={isSubmitting}");
  });

  it("boot flow skips repeat launch and caps splash duration", () => {
    expect(launch).toContain("hasSeenLaunchBefore");
    expect(appShell).toContain("MAX_BOOT_SPLASH_MS");
    expect(appShell).toContain("appContentVisible");
    expect(launch).not.toContain("Enter Lexienn");
  });

  it("header remains safe-area compliant", () => {
    const header = readFileSync("components/layout/CompactHeader.tsx", "utf8");
    expect(header).toContain("safe-area-top");
  });
});
