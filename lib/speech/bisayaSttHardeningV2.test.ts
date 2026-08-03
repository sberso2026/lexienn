import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BISAYA_BASE_PROMPT,
  BISAYA_CONFIRM_MESSAGE,
  isCebuanoLanguageHint,
} from "@/lib/speech/bisayaStt";
import { BISAYA_STT_REGRESSION_PHRASES } from "@/lib/speech/bisayaSttCorpus";
import { buildBisayaSttPrompt } from "@/lib/speech/bisayaSttPrompt";
import {
  correctBisayaTranscript,
  generateBisayaTeachVariants,
  scoreCebuanoLexicalOverlap,
} from "@/lib/speech/bisayaLexiconCorrection";
import {
  containsArabicScript,
  containsJapaneseScript,
  containsChineseScript,
  containsHebrewScript,
  containsCyrillicScript,
  validateBisayaTranscript,
} from "@/lib/speech/bisayaTranscriptValidation";
import { checkBisayaAudioQuality } from "@/lib/speech/bisayaAudioQuality";
import {
  resolveConstrainedSttLanguage,
  resolveConstrainedSttModel,
} from "@/lib/speech/constrainedSttLanguage";
import { resolveSpeechCaptureLanguagePlan } from "@/lib/speech/resolveSpeechCaptureLanguage";
import { mapLanguageHintToWhisper } from "@/lib/speech/speechToTextService";
import {
  __resetMicSessionCoordinatorForTests,
  acquireMicSession,
  getActiveMicSessionOwnerId,
} from "@/lib/voice/micSessionCoordinator";

describe("Batch 51D Bisaya STT hardening v2", () => {
  beforeEach(() => {
    __resetMicSessionCoordinatorForTests();
    vi.unstubAllEnvs();
  });

  it("never sends unsupported language=ceb", () => {
    const plan = resolveConstrainedSttLanguage("ceb");
    expect(plan.expectedLanguage).toBe("ceb");
    expect(plan.transportLanguage).toBe("");
    expect(plan.omitLanguageParam).toBe(true);
    expect(mapLanguageHintToWhisper("ceb")).toBeUndefined();

    const service = readFileSync(
      join(process.cwd(), "lib/speech/speechToTextService.ts"),
      "utf8",
    );
    expect(service).toContain("Never send unsupported language=ceb");
    expect(service).toContain('formData.append("temperature"');
  });

  it("forces gpt-4o-transcribe and server-only capture for Cebuano", () => {
    expect(resolveConstrainedSttModel("ceb", "whisper-1")).toBe("gpt-4o-transcribe");
    const plan = resolveSpeechCaptureLanguagePlan("ceb");
    expect(plan.preferRecordedTranscription).toBe(true);
    expect(isCebuanoLanguageHint("ceb")).toBe(true);

    const hook = readFileSync(join(process.cwd(), "hooks/useVoiceInput.ts"), "utf8");
    const capture = readFileSync(join(process.cwd(), "lib/voice/voiceCapture.ts"), "utf8");
    expect(hook).toContain("forceServerOnlyTranscription: forceServerOnly");
    expect(capture).toContain("forceServerOnlyTranscription");
    expect(capture).toContain("recorded_audio_transcription");
  });

  it("amping never resolves to I'm ping / I'm bing", () => {
    for (const sample of [
      "I'm ping",
      "I'm bing",
      "Im ping",
      "I am ping",
      "ampingg",
      "amping.",
    ]) {
      const corrected = correctBisayaTranscript(sample).transcript.toLowerCase();
      expect(corrected).not.toMatch(/i['']?m\s*(ping|bing)/i);
      expect(corrected).toContain("amping");
    }
  });

  it("rejects Arabic/Japanese/Chinese/Hebrew/Cyrillic scripts", () => {
    expect(containsJapaneseScript("こんにちは")).toBe(true);
    expect(containsArabicScript("مرحبا")).toBe(true);
    expect(containsChineseScript("你好")).toBe(true);
    expect(containsHebrewScript("שלום")).toBe(true);
    expect(containsCyrillicScript("привет")).toBe(true);

    for (const bad of ["こんにちは", "مرحبا", "你好", "שלום", "привет"]) {
      const result = validateBisayaTranscript({
        transcript: bad,
        expectedLanguage: "ceb",
        confidence: 0.95,
      });
      expect(result.ok).toBe(false);
      expect(result.needsConfirmation).toBe(true);
    }
  });

  it("uses strong Cebuano prompt and retries with stronger prompt", () => {
    const prompt = buildBisayaSttPrompt({});
    expect(prompt).toContain("Do not output English phonetic guesses");
    expect(prompt).toContain("amping");
    expect(BISAYA_BASE_PROMPT).toContain("Transcribe exactly in Cebuano/Bisaya");

    const service = readFileSync(
      join(process.cwd(), "lib/speech/speechToTextService.ts"),
      "utf8",
    );
    expect(service).toContain("strongRetry: true");
  });

  it("low lexical score / confidence blocks translation confirmation path", () => {
    const low = validateBisayaTranscript({
      transcript: "hello there friend",
      expectedLanguage: "ceb",
      confidence: 0.9,
    });
    expect(low.needsConfirmation).toBe(true);
    expect(scoreCebuanoLexicalOverlap("amping kanunay")).toBeGreaterThan(0.5);
    expect(BISAYA_CONFIRM_MESSAGE).toBe(
      "We may not have heard this Bisaya phrase correctly.",
    );
  });

  it("regression phrases cover amping variants and common Bisaya", () => {
    for (const required of [
      "Amping.",
      "Amping kanunay.",
      "Pag-amping.",
      "Amping mo.",
      "Maayo.",
      "Asa ka padulong?",
      "Wala ko kasabot.",
      "Palihog tabangi ko.",
    ]) {
      expect(BISAYA_STT_REGRESSION_PHRASES).toContain(required);
    }
  });

  it("taught corrections add phrase variants for future hints", () => {
    const variants = generateBisayaTeachVariants("amping");
    expect(variants.map((v) => v.toLowerCase())).toEqual(
      expect.arrayContaining(["amping", "pag-amping", "amping mo"]),
    );
  });

  it("audio quality rejects too-short / tiny clips", () => {
    expect(
      checkBisayaAudioQuality({ durationMs: 200, byteLength: 5000 }).ok,
    ).toBe(false);
    expect(
      checkBisayaAudioQuality({ durationMs: 1000, byteLength: 200 }).ok,
    ).toBe(false);
    expect(
      checkBisayaAudioQuality({ durationMs: 900, byteLength: 5000 }).ok,
    ).toBe(true);
  });

  it("UI has Confirm / Try Again / Type Manually and never persists audio", () => {
    const panel = readFileSync(
      join(process.cwd(), "components/conversation/ConversationSpeakerPanel.tsx"),
      "utf8",
    );
    expect(panel).toContain("Confirm");
    expect(panel).toContain("Try Again");
    expect(panel).toContain("Type Manually");
    expect(panel).toContain("BISAYA_CONFIRM_MESSAGE");
    expect(BISAYA_CONFIRM_MESSAGE).toBe(
      "We may not have heard this Bisaya phrase correctly.",
    );

    const route = readFileSync(
      join(process.cwd(), "app/api/voice/transcribe/route.ts"),
      "utf8",
    );
    expect(route).toContain("never persisted");
  });

  it("Person A/B mic handover still works", () => {
    const releaseA = vi.fn();
    acquireMicSession("conversation:a", releaseA);
    acquireMicSession("conversation:b", vi.fn());
    expect(releaseA).toHaveBeenCalled();
    expect(getActiveMicSessionOwnerId()).toBe("conversation:b");
  });
});
