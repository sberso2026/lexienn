import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AUTO_DETECT_LANGUAGE,
  decideSpokenLanguageDetection,
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
    const mic = readFileSync(join(process.cwd(), "lib/speech/micAudioConstraints.ts"), "utf8");

    expect(translator).toContain("AUTO_DETECT_LANGUAGE");
    expect(translator).toContain("handleLanguageDetection");
    expect(translator).toContain("showPrivacyNote");
    expect(voiceArea).toContain("onLanguageDetection");
    expect(stt).toContain('normalized === "auto"');
    expect(mic).toContain("echoCancellation: true");
    expect(mic).toContain("noiseSuppression: true");
    expect(mic).toContain("channelCount: 1");
  });

  it("does not persist recordings by default", () => {
    const route = readFileSync(join(process.cwd(), "app/api/voice/transcribe/route.ts"), "utf8");
    expect(route).not.toContain("writeFile");
    expect(route).not.toContain("fs.");
    expect(route).toContain("detectedLanguageCode");
  });
});
