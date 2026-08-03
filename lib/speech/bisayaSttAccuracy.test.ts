import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BISAYA_BASE_PROMPT,
  BISAYA_CONFIRM_MESSAGE,
  CEBUANO_BASE,
  isCebuanoLanguageHint,
} from "@/lib/speech/bisayaStt";
import { BISAYA_STT_REGRESSION_PHRASES, assertBisayaSttCorpusSize } from "@/lib/speech/bisayaSttCorpus";
import { buildBisayaSttPrompt, collectBoundedSttHints } from "@/lib/speech/bisayaSttPrompt";
import {
  containsArabicScript,
  containsJapaneseScript,
  isProviderLanguageAllowedForCebuano,
  validateBisayaTranscript,
} from "@/lib/speech/bisayaTranscriptValidation";
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

describe("Batch 51D Bisaya STT accuracy", () => {
  beforeEach(() => {
    __resetMicSessionCoordinatorForTests();
    vi.unstubAllEnvs();
  });

  it("curated Bisaya regression set has at least 40 phrases including required samples", () => {
    expect(assertBisayaSttCorpusSize(40)).toBeGreaterThanOrEqual(40);
    expect(BISAYA_STT_REGRESSION_PHRASES.length).toBeGreaterThanOrEqual(40);
    for (const required of [
      "Kumusta ka?",
      "Unsa imong pangalan?",
      "Asa ang simbahan?",
      "Pila kini?",
      "Palihog tabangi ko.",
      "Gikinahanglan nako og doktor.",
      "Maayong buntag.",
      "Asa ka padulong?",
      "Wala ko kasabot.",
      "Hinay-hinayi palihog.",
    ]) {
      expect(BISAYA_STT_REGRESSION_PHRASES).toContain(required);
    }
  });

  it("uses fixed Cebuano language path — never open auto-detect", () => {
    const plan = resolveSpeechCaptureLanguagePlan("ceb");
    expect(plan.whisperLanguageHint).toBe(CEBUANO_BASE);
    expect(plan.reason).toBe("cebuano_constrained");
    expect(plan.preferRecordedTranscription).toBe(true);

    const bisaya = resolveSpeechCaptureLanguagePlan("ceb::bisaya");
    expect(bisaya.whisperLanguageHint).toBe("ceb");
    expect(isCebuanoLanguageHint("ceb::bisaya")).toBe(true);
  });

  it("prefers gpt-4o-transcribe for Cebuano when whisper-1 is configured", () => {
    expect(resolveConstrainedSttModel("ceb", "whisper-1")).toBe("gpt-4o-transcribe");
    expect(resolveConstrainedSttModel("fil", "whisper-1")).toBe("whisper-1");
  });

  it("sends ceb transport on gpt-4o-transcribe, closest tl on whisper", () => {
    const supported = resolveConstrainedSttLanguage("ceb", "gpt-4o-transcribe");
    expect(supported.expectedLanguage).toBe("ceb");
    expect(supported.transportLanguage).toBe("ceb");
    expect(supported.constrained).toBe(true);

    const whisper = resolveConstrainedSttLanguage("ceb", "whisper-1");
    expect(whisper.expectedLanguage).toBe("ceb");
    expect(whisper.transportLanguage).toBe("tl");
    expect(mapLanguageHintToWhisper("ceb")).toBe("tl");
  });

  it("includes Bisaya transcription prompt vocabulary", () => {
    const prompt = buildBisayaSttPrompt({});
    expect(prompt).toContain("Cebuano/Bisaya");
    expect(prompt).toContain("Do not translate");
    expect(prompt).toContain("kumusta");
    expect(BISAYA_BASE_PROMPT).toContain("palihog");
  });

  it("rejects Japanese/Arabic script for expected Cebuano", () => {
    expect(containsJapaneseScript("こんにちは")).toBe(true);
    expect(containsArabicScript("مرحبا")).toBe(true);

    const ja = validateBisayaTranscript({
      transcript: "こんにちは",
      expectedLanguage: "ceb",
      providerLanguage: "ja",
      confidence: 0.9,
    });
    expect(ja.ok).toBe(false);
    expect(ja.rejectedScript).toBe("japanese");
    expect(ja.needsConfirmation).toBe(true);

    const ar = validateBisayaTranscript({
      transcript: "مرحبا بكم",
      expectedLanguage: "ceb",
      providerLanguage: "ar",
      confidence: 0.9,
    });
    expect(ar.ok).toBe(false);
    expect(ar.rejectedScript).toBe("arabic");
  });

  it("rejects provider language outside ceb/fil/tl/en", () => {
    expect(isProviderLanguageAllowedForCebuano("ja")).toBe(false);
    expect(isProviderLanguageAllowedForCebuano("ar")).toBe(false);
    expect(isProviderLanguageAllowedForCebuano("ceb")).toBe(true);
    expect(isProviderLanguageAllowedForCebuano("tl")).toBe(true);

    const bad = validateBisayaTranscript({
      transcript: "Kumusta ka?",
      expectedLanguage: "ceb",
      providerLanguage: "ja",
      confidence: 0.9,
    });
    // Japanese script not present but provider language rejected
    expect(bad.ok).toBe(false);
    expect(bad.rejectedProviderLanguage).toBe("ja");
  });

  it("low confidence requires confirmation and blocks auto-translate messaging", () => {
    const low = validateBisayaTranscript({
      transcript: "Kumusta ka?",
      expectedLanguage: "ceb",
      providerLanguage: "ceb",
      confidence: 0.4,
    });
    expect(low.ok).toBe(true);
    expect(low.needsConfirmation).toBe(true);
    expect(BISAYA_CONFIRM_MESSAGE).toBe(
      "Please check the Bisaya transcript before translating.",
    );
  });

  it("accepts common Bisaya phrases with good confidence", () => {
    for (const phrase of BISAYA_STT_REGRESSION_PHRASES.slice(0, 10)) {
      const result = validateBisayaTranscript({
        transcript: phrase,
        expectedLanguage: "ceb",
        providerLanguage: "ceb",
        confidence: 0.9,
      });
      expect(result.ok).toBe(true);
      expect(result.needsConfirmation).toBe(false);
      expect(containsJapaneseScript(phrase)).toBe(false);
      expect(containsArabicScript(phrase)).toBe(false);
    }
  });

  it("corrected/taught phrases become future STT hints", () => {
    const hints = collectBoundedSttHints({
      taughtBisayaPhrases: ["Hinay-hinayi palihog."],
      recentConversationTerms: ["Asa ang simbahan?"],
    });
    expect(hints).toContain("Hinay-hinayi palihog.");
    expect(hints).toContain("Asa ang simbahan?");
    expect(hints).toContain("kumusta");
  });

  it("Person A/B mic isolation and cleanup still wired", () => {
    const releaseA = vi.fn();
    acquireMicSession("conversation:a", releaseA);
    acquireMicSession("conversation:b", vi.fn());
    expect(releaseA).toHaveBeenCalled();
    expect(getActiveMicSessionOwnerId()).toBe("conversation:b");

    const view = readFileSync(
      join(process.cwd(), "components/conversation/ConversationView.tsx"),
      "utf8",
    );
    expect(view).toContain("hardStopSession");
    expect(view).toContain("needsTranscriptConfirm");
    expect(view).toContain("Please check the Bisaya transcript before translating.");
    const panel = readFileSync(
      join(process.cwd(), "components/conversation/ConversationSpeakerPanel.tsx"),
      "utf8",
    );
    expect(panel).toContain("Teach Lexienn this Bisaya phrase");
  });

  it("does not persist audio — only in-request buffer", () => {
    const route = readFileSync(
      join(process.cwd(), "app/api/voice/transcribe/route.ts"),
      "utf8",
    );
    const storage = readFileSync(
      join(process.cwd(), "lib/storage/bisayaSttHintsStorage.ts"),
      "utf8",
    );
    expect(route).toContain("never persisted");
    expect(storage).toContain("Never stores audio");
    expect(storage).not.toMatch(/audioBuffer|Blob|getUserMedia/);
  });

  it("server STT service retries with stronger Cebuano prompt path", () => {
    const service = readFileSync(
      join(process.cwd(), "lib/speech/speechToTextService.ts"),
      "utf8",
    );
    expect(service).toContain("strongRetry: true");
    expect(service).toContain("buildBisayaSttPrompt");
    expect(service).toContain("needs_confirmation");
  });
});
