import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearAllRequestCaches } from "@/lib/request/requestCache";
import { clearLanguageDetectionDiagnostic } from "@/lib/languages/languageDetectionDiagnostics";
import { detectLanguageLocal } from "@/lib/languages/localLanguageDetector";
import { detectLanguagePipeline } from "@/lib/languages/languageDetectionPipeline";
import { decideSpokenLanguageDetection } from "@/lib/languages/spokenLanguageDetection";
import { LANGUAGE_VOCABULARY } from "@/lib/languages/languageDetectionPhrases";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Batch 52A language detection hardening", () => {
  beforeEach(() => {
    clearAllRequestCaches();
    clearLanguageDetectionDiagnostic();
  });

  it("includes required Cebuano vocabulary markers", () => {
    for (const word of [
      "amping",
      "unsa",
      "asa",
      "ngano",
      "kanus-a",
      "palihog",
      "maayo",
      "bitaw",
      "gyud",
      "jud",
      "lagi",
      "ambot",
      "adto",
      "diri",
      "didto",
    ]) {
      expect(LANGUAGE_VOCABULARY.ceb).toContain(word);
    }
  });

  it.each([
    ["What is your name?", "en"],
    ["How are you?", "en"],
    ["Good morning.", "en"],
    ["Kumusta ka?", "tl"],
    ["Magandang umaga.", "tl"],
    ["Amping.", "ceb"],
    ["Amping pirmi.", "ceb"],
    ["Unsa imong pangalan?", "ceb"],
    ["Hola amigo.", "es"],
    ["Bonjour.", "fr"],
    ["こんにちは", "ja"],
    ["مرحبا", "ar"],
  ])("auto-detects %s → %s", async (text, code) => {
    const local = detectLanguageLocal(text);
    expect(local.primaryCode).toBe(code);
    expect(local.confidence).toBeGreaterThanOrEqual(0.95);

    const pipeline = await detectLanguagePipeline(text, { localOnly: true });
    expect(pipeline.primaryCode).toBe(code);
    expect(pipeline.confidence).toBeGreaterThanOrEqual(0.95);
    expect(pipeline.aiCalled).toBe(false);
    expect(pipeline.needsUserConfirmation).toBe(false);
    expect(pipeline.message).not.toContain("could not be detected reliably");

    const decision = decideSpokenLanguageDetection({
      detectedLanguageCode: pipeline.primaryCode,
      confidence: pipeline.confidence,
      secondaryLanguageCode: pipeline.secondaryCode,
    });
    expect(decision.action).toBe("apply");
  });

  it("detects mixed English + Filipino with primary English", async () => {
    const pipeline = await detectLanguagePipeline("Good morning, kumusta ka?", {
      localOnly: true,
    });
    expect(pipeline.primaryCode).toBe("en");
    expect(pipeline.secondaryCode).toBe("tl");
    expect(pipeline.confidence).toBeGreaterThanOrEqual(0.95);
    expect(pipeline.aiCalled).toBe(false);
    expect(pipeline.message.toLowerCase()).toContain("english");
  });

  it("caches detection results", async () => {
    const first = await detectLanguagePipeline("What is your name?", { localOnly: true });
    const second = await detectLanguagePipeline("What is your name?", { localOnly: true });
    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    expect(second.stage).toBe("cache");
    expect(second.primaryCode).toBe("en");
  });

  it("does not call AI for obvious local languages", async () => {
    const aiIdentifier = vi.fn(async () => ({
      primaryCode: "xx",
      secondaryCode: null,
      confidence: 0.4,
    }));
    const result = await detectLanguagePipeline("Bonjour.", {
      allowAi: true,
      aiIdentifier,
    });
    expect(aiIdentifier).not.toHaveBeenCalled();
    expect(result.primaryCode).toBe("fr");
    expect(result.stage).toBe("local");
    expect(result.aiCalled).toBe(false);
  });

  it("asks the user only when confidence stays below apply threshold", async () => {
    const aiIdentifier = vi.fn(async () => ({
      primaryCode: "en",
      secondaryCode: null,
      confidence: 0.6,
    }));
    const result = await detectLanguagePipeline("zzzz qqqq wwww", {
      allowAi: true,
      aiIdentifier,
    });
    expect(aiIdentifier).toHaveBeenCalled();
    expect(result.needsUserConfirmation).toBe(true);
    expect(result.stage).toBe("user");
    expect(result.message).toContain("Use this language?");
  });

  it("wires 3-stage pipeline into voice + translator + API", () => {
    const pipeline = readFileSync(
      join(process.cwd(), "lib/languages/languageDetectionPipeline.ts"),
      "utf8",
    );
    const voice = readFileSync(join(process.cwd(), "hooks/useVoiceInput.ts"), "utf8");
    const translator = readFileSync(
      join(process.cwd(), "components/translator/TextTranslatorView.tsx"),
      "utf8",
    );
    const route = readFileSync(
      join(process.cwd(), "app/api/language/detect/route.ts"),
      "utf8",
    );
    expect(pipeline).toContain("LOCAL_SKIP_AI_CONFIDENCE");
    expect(pipeline).toContain("identifyLanguageWithAi");
    expect(voice).toContain("detectLanguagePipeline");
    expect(voice).toContain("detectLanguageViaApi");
    expect(translator).toContain("language-detection-diagnostics");
    expect(translator).toContain("formatDetectionStageLabel");
    expect(route).toContain("detectLanguagePipeline");
  });
});
