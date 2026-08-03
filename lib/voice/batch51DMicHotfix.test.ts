import { describe, expect, it, beforeEach, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  __resetMicSessionCoordinatorForTests,
  acquireMicSession,
  getActiveMicSessionOwnerId,
  isMicSessionOwnedBy,
  releaseMicSession,
} from "@/lib/voice/micSessionCoordinator";
import {
  resolveSpeechCaptureLanguagePlan,
  isBrowserSpeechLocaleLikelyUnsupported,
} from "@/lib/speech/resolveSpeechCaptureLanguage";

describe("Batch 51D Person B mic hotfix", () => {
  beforeEach(() => {
    __resetMicSessionCoordinatorForTests();
  });

  it("keeps exclusive mic ownership — only one session active", () => {
    const releaseA = vi.fn();
    const releaseB = vi.fn();

    acquireMicSession("conversation:a", releaseA);
    expect(getActiveMicSessionOwnerId()).toBe("conversation:a");
    expect(isMicSessionOwnedBy("conversation:a")).toBe(true);

    acquireMicSession("conversation:b", releaseB);
    expect(releaseA).toHaveBeenCalledTimes(1);
    expect(getActiveMicSessionOwnerId()).toBe("conversation:b");
    expect(isMicSessionOwnedBy("conversation:a")).toBe(false);

    releaseMicSession("conversation:b");
    expect(getActiveMicSessionOwnerId()).toBeNull();
  });

  it("retry acquire by same owner replaces release without peer release", () => {
    const first = vi.fn();
    const second = vi.fn();
    acquireMicSession("conversation:b", first);
    acquireMicSession("conversation:b", second);
    expect(first).not.toHaveBeenCalled();
    expect(getActiveMicSessionOwnerId()).toBe("conversation:b");
    releaseMicSession("conversation:a");
    expect(getActiveMicSessionOwnerId()).toBe("conversation:b");
  });

  it("Cebuano/Bisaya prefers server STT constrained path, not open auto", () => {
    const plan = resolveSpeechCaptureLanguagePlan("ceb");
    expect(plan.preferRecordedTranscription).toBe(true);
    expect(plan.whisperLanguageHint).toBe("ceb");
    expect(plan.reason).toBe("cebuano_constrained");
    expect(isBrowserSpeechLocaleLikelyUnsupported("ceb")).toBe(true);

    const bisaya = resolveSpeechCaptureLanguagePlan("ceb::bisaya");
    expect(bisaya.preferRecordedTranscription).toBe(true);
    expect(bisaya.whisperLanguageHint).toBe("ceb");
  });

  it("Filipino/Tagalog keeps mapped locale path", () => {
    const plan = resolveSpeechCaptureLanguagePlan("fil");
    expect(plan.resolvedBrowserLocale).toBe("fil-PH");
    expect(plan.whisperLanguageHint).toBe("fil");
    expect(plan.preferRecordedTranscription).toBe(false);
  });

  it("Auto Detect uses server path", () => {
    const plan = resolveSpeechCaptureLanguagePlan("auto");
    expect(plan.preferRecordedTranscription).toBe(true);
    expect(plan.whisperLanguageHint).toBeUndefined();
  });

  it("wires Conversation A/B isolated session owners and cleanup exits", () => {
    const view = readFileSync(
      join(process.cwd(), "components/conversation/ConversationView.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      join(process.cwd(), "components/conversation/ConversationSpeakerPanel.tsx"),
      "utf8",
    );
    const hook = readFileSync(join(process.cwd(), "hooks/useVoiceInput.ts"), "utf8");
    const capture = readFileSync(join(process.cwd(), "lib/voice/voiceCapture.ts"), "utf8");

    expect(panel).toContain('sessionOwnerId={`conversation:${speaker}`}');
    expect(view).toContain("voiceApiARef");
    expect(view).toContain("voiceApiBRef");
    expect(view).toContain("hardStopSession");
    expect(view).toContain("handleMicSessionStart");
    expect(view).toContain("clearError");
    expect(hook).toContain("acquireMicSession");
    expect(hook).toContain("resolveSpeechCaptureLanguagePlan");
    expect(hook).toContain("preferRecordedTranscription");
    expect(hook).toContain("browserLocaleHint");
    expect(hook).toContain("hardStopSession");
    expect(hook).toContain("forceServerOnlyTranscription");
    expect(capture).toContain("stopAllTracks");
    expect(capture).toContain("Synchronously release hardware");
  });

  it("abort stops MediaStream tracks so Person B can reopen mic", () => {
    const capture = readFileSync(join(process.cwd(), "lib/voice/voiceCapture.ts"), "utf8");
    expect(capture).not.toMatch(
      /activeStream = null;\s*\n\s*readyCallbacks\.resolve/,
    );
    expect(capture).toContain("activeStream?.getTracks()");
  });

  it("server STT uses constrained Cebuano path (omit unsupported language=ceb)", () => {
    const service = readFileSync(
      join(process.cwd(), "lib/speech/speechToTextService.ts"),
      "utf8",
    );
    expect(service).toContain("resolveConstrainedSttLanguage");
    expect(service).toContain("buildBisayaSttPrompt");
    expect(service).toContain("Never send unsupported language=ceb");
  });

  it("Developer Mode mic logs omit audio/secrets", () => {
    expect(existsSync(join(process.cwd(), "lib/voice/micSessionDebug.ts"))).toBe(true);
    const debug = readFileSync(join(process.cwd(), "lib/voice/micSessionDebug.ts"), "utf8");
    expect(debug).toContain("side");
    expect(debug).toContain("selectedLanguage");
    expect(debug).toContain("resolvedLocale");
    expect(debug).toContain("path");
    expect(debug).toContain("errorCode");
    expect(debug).not.toMatch(/audioBuffer|getUserMedia|AI_API_KEY|transcript\.raw/);
  });

  it("typed draft is controlled by parent — mic failure must not wipe value prop", () => {
    const area = readFileSync(
      join(process.cwd(), "components/speech/VoiceInputTextArea.tsx"),
      "utf8",
    );
    expect(area).toContain("value={value}");
    expect(area).toContain("onChange={(event) => onChange(event.target.value)}");
    expect(area).toContain("onTryAgain={voice.startListening}");
    // Retry path recreates session via startListening → hardStopSession + fresh capture.
    const hook = readFileSync(join(process.cwd(), "hooks/useVoiceInput.ts"), "utf8");
    expect(hook).toContain("Always tear down any prior session");
    expect(hook).toContain("Clear only this side's transient mic UI state");
  });
});
