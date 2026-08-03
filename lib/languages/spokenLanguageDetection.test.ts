import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AUTO_DETECT_LANGUAGE,
  buildSpokenLanguageDetectionResult,
  decideSpokenLanguageDetection,
  inferSpokenLanguageFromTranscript,
  isAutoDetectLanguage,
  mapProviderLanguageToCatalog,
} from "@/lib/languages/spokenLanguageDetection";

describe("Batch 51B spoken language detection", () => {
  it("maps Māori and Filipino provider codes to catalog values", () => {
    expect(mapProviderLanguageToCatalog("mi")?.value).toBe("mi");
    expect(mapProviderLanguageToCatalog("mao")?.value).toBe("mi");
    expect(mapProviderLanguageToCatalog("mi-NZ")?.display_name).toContain("Māori");
    expect(mapProviderLanguageToCatalog("fil")?.value).toBe("tl");
    expect(mapProviderLanguageToCatalog("tl")?.value).toBe("tl");
  });

  it("does not crash on unsupported provider codes", () => {
    expect(mapProviderLanguageToCatalog("xx-unknown")).toBeNull();
    expect(mapProviderLanguageToCatalog("")).toBeNull();
    expect(mapProviderLanguageToCatalog(undefined)).toBeNull();
  });

  it("applies high-confidence detection automatically", () => {
    const decision = decideSpokenLanguageDetection({
      detectedLanguageCode: "mi",
      confidence: 0.82,
    });
    expect(decision.action).toBe("apply");
    expect(decision.catalogValue).toBe("mi");
    expect(decision.message).toContain("Detected: Māori");
  });

  it("requests confirmation for medium confidence", () => {
    const decision = decideSpokenLanguageDetection({
      detectedLanguageCode: "fil",
      confidence: 0.6,
    });
    expect(decision.action).toBe("confirm");
    expect(decision.catalogValue).toBe("tl");
    expect(decision.message).toContain("Use this language?");
  });

  it("keeps Auto Detect for low confidence", () => {
    const decision = decideSpokenLanguageDetection({
      detectedLanguageCode: "en",
      confidence: 0.2,
    });
    expect(decision.action).toBe("keep_auto");
    expect(decision.catalogValue).toBeNull();
    expect(decision.message).toContain("Select it manually");
  });

  it("recognizes Auto Detect language value", () => {
    expect(isAutoDetectLanguage(AUTO_DETECT_LANGUAGE)).toBe(true);
    expect(isAutoDetectLanguage("en")).toBe(false);
  });

  it("wires Auto Detect and privacy note into Translator", () => {
    const translator = readFileSync(
      join(process.cwd(), "components/translator/TextTranslatorView.tsx"),
      "utf8",
    );
    const voiceArea = readFileSync(
      join(process.cwd(), "components/speech/VoiceInputTextArea.tsx"),
      "utf8",
    );
    const stt = readFileSync(join(process.cwd(), "lib/speech/speechToTextService.ts"), "utf8");
    const constrained = readFileSync(
      join(process.cwd(), "lib/speech/constrainedSttLanguage.ts"),
      "utf8",
    );
    const mic = readFileSync(join(process.cwd(), "lib/speech/micAudioConstraints.ts"), "utf8");

    expect(translator).toContain("AUTO_DETECT_LANGUAGE");
    expect(translator).toContain("handleLanguageDetection");
    expect(translator).toContain("showPrivacyNote");
    expect(voiceArea).toContain("onLanguageDetection");
    expect(stt).toContain("resolveConstrainedSttLanguage");
    expect(constrained).toContain('expectedLanguage: "auto"');
    expect(mic).toContain("echoCancellation: true");
    expect(mic).toContain("noiseSuppression: true");
    expect(mic).toContain("channelCount: 1");
  });

  it("infers English from common spoken phrases when provider language is missing", () => {
    const inferred = inferSpokenLanguageFromTranscript("what's your name?");
    expect(inferred.code).toBe("en");
    expect(inferred.confidence).toBeGreaterThanOrEqual(0.75);

    const built = buildSpokenLanguageDetectionResult({
      transcript: "what's your name?",
      providerLanguage: null,
      confidence: null,
      source: "server_stt",
    });
    expect(built.detectedLanguageCode).toBe("en");
    expect(built.detectedLanguageName).toMatch(/English/i);
    expect(decideSpokenLanguageDetection(built).action).toBe("apply");
  });

  it("requests verbose_json so Whisper can return a language code", () => {
    const stt = readFileSync(join(process.cwd(), "lib/speech/speechToTextService.ts"), "utf8");
    expect(stt).toContain("verbose_json");
    expect(stt).toContain("preferVerboseJson");
    expect(stt).toContain("inferSpokenLanguageFromTranscript");
  });
});
