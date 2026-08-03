import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { clearAllRequestCaches } from "@/lib/request/requestCache";
import { clearLanguageDetectionDiagnostic } from "@/lib/languages/languageDetectionDiagnostics";
import { resolveMicSpokenLanguageDetection } from "@/lib/languages/resolveMicSpokenLanguageDetection";
import { decideSpokenLanguageDetection } from "@/lib/languages/spokenLanguageDetection";
import { detectLanguagePipeline } from "@/lib/languages/languageDetectionPipeline";

describe("Batch 52A voice Auto Detect hotfix", () => {
  beforeEach(() => {
    clearAllRequestCaches();
    clearLanguageDetectionDiagnostic();
  });

  it("mic What's your name? → From=English apply immediately", () => {
    const resolved = resolveMicSpokenLanguageDetection({
      transcript: "What's your name?",
      providerLanguage: null,
      providerConfidence: null,
      source: "server_stt",
    });
    expect(resolved.canApply).toBe(true);
    expect(resolved.needsAi).toBe(false);
    expect(resolved.detection.detectedLanguageCode).toBe("en");
    expect(resolved.detection.confidence).toBeGreaterThanOrEqual(0.75);
    expect(decideSpokenLanguageDetection(resolved.detection).action).toBe("apply");
  });

  it("mic English with STT provider language applies From immediately", () => {
    const resolved = resolveMicSpokenLanguageDetection({
      transcript: "What's your name?",
      providerLanguage: "en",
      providerConfidence: 0.85,
      source: "server_stt",
    });
    expect(resolved.canApply).toBe(true);
    expect(resolved.detection.detectedLanguageCode).toBe("en");
    expect(resolved.needsAi).toBe(false);
  });

  it("mic Filipino → From=Filipino", () => {
    const resolved = resolveMicSpokenLanguageDetection({
      transcript: "Kumusta ka?",
      providerLanguage: null,
      providerConfidence: null,
    });
    expect(resolved.canApply).toBe(true);
    expect(resolved.detection.detectedLanguageCode).toBe("tl");
    expect(resolved.detection.detectedLanguageName).toMatch(/Filipino/i);
  });

  it("mic Cebuano → From=Cebuano when confirmed by local detector", () => {
    const resolved = resolveMicSpokenLanguageDetection({
      transcript: "Unsa imong pangalan?",
      providerLanguage: null,
      providerConfidence: null,
    });
    expect(resolved.canApply).toBe(true);
    expect(resolved.detection.detectedLanguageCode).toBe("ceb");
  });

  it("missing provider language falls back to transcript detection", () => {
    const resolved = resolveMicSpokenLanguageDetection({
      transcript: "Good morning.",
      providerLanguage: null,
      providerConfidence: null,
    });
    expect(resolved.detection.detectedLanguageCode).toBe("en");
    expect(resolved.canApply).toBe(true);
  });

  it("preserves transcript text on detection", () => {
    const transcript = "What's your name?";
    const resolved = resolveMicSpokenLanguageDetection({
      transcript,
      providerLanguage: "en",
      providerConfidence: 0.9,
    });
    expect(resolved.detection.transcript).toBe(transcript);
  });

  it("wires mic resolver into voice input and clears stale From errors", () => {
    const voice = readFileSync(join(process.cwd(), "hooks/useVoiceInput.ts"), "utf8");
    const translator = readFileSync(
      join(process.cwd(), "components/translator/TextTranslatorView.tsx"),
      "utf8",
    );
    expect(voice).toContain("resolveMicSpokenLanguageDetection");
    expect(voice).toContain("onLanguageDetectionRef");
    expect(translator).toContain("sourceLanguageRef");
    expect(translator).toContain("setFormError(null)");
    expect(translator).toContain("could not be detected reliably");
    expect(translator).toContain("Select a From language");
  });

  it("manual From selection guard remains in Translator", () => {
    const translator = readFileSync(
      join(process.cwd(), "components/translator/TextTranslatorView.tsx"),
      "utf8",
    );
    expect(translator).toContain("sourceLanguageRef.current");
    expect(translator).toContain("isAutoDetectLanguage(sourceLanguageRef.current)");
  });

  it("typed Auto Detect local pipeline still passes without provider language", async () => {
    const result = await detectLanguagePipeline("What is your name?", {
      localOnly: true,
    });
    expect(result.primaryCode).toBe("en");
    expect(result.aiCalled).toBe(false);
    expect(result.confidence).toBeGreaterThanOrEqual(0.95);
  });
});
