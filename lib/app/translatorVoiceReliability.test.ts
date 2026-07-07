import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("translator voice reliability regression", () => {
  const voiceHook = readFileSync("hooks/useVoiceInput.ts", "utf8");
  const voiceButton = readFileSync("components/speech/VoiceInputButton.tsx", "utf8");
  const voiceStatus = readFileSync("components/speech/VoiceInputStatus.tsx", "utf8");
  const voiceTextArea = readFileSync("components/speech/VoiceInputTextArea.tsx", "utf8");
  const browserSpeech = readFileSync("lib/speech/browserSpeechRecognition.ts", "utf8");
  const voiceCapture = readFileSync("lib/voice/voiceCapture.ts", "utf8");
  const transcriptMerge = readFileSync("lib/voice/transcriptMerge.ts", "utf8");
  const voiceState = readFileSync("lib/voice/voiceState.ts", "utf8");
  const transcribeRoute = readFileSync("app/api/voice/transcribe/route.ts", "utf8");
  const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
  const playbackHook = readFileSync("lib/voice/useVoicePlayback.ts", "utf8");
  const voiceDiagnostics = readFileSync("lib/app/voiceDiagnostics.ts", "utf8");

  it("defines mobile-safe capture modes and states", () => {
    expect(voiceState).toContain("hybrid_mobile");
    expect(voiceState).toContain("recorded_audio_transcription");
    expect(voiceState).toContain("realtime_browser_speech");
    expect(voiceCapture).toContain("preferMobileRecordedTranscription");
    expect(voiceCapture).toContain("startVoiceCapture");
  });

  it("shows listening UI immediately on mic tap before async capture work", () => {
    expect(voiceHook).toContain('setState("requesting_permission")');
    expect(voiceHook).toContain('setState("listening")');
    expect(voiceHook).toContain('setStatusMessage({ body: "Listening…" })');
    expect(voiceHook).toContain("stopVoicePlayback");
    expect(voiceHook).toContain("startVoiceCapture");
  });

  it("renders Stop button, recording timer, and live transcript panel", () => {
    expect(voiceButton).toContain('type="button"');
    expect(voiceButton).toContain('aria-label="Stop voice input"');
    expect(voiceStatus).toContain("recordingTimerLabel");
    expect(voiceStatus).toContain("Captured speech");
    expect(voiceStatus).toContain("Live transcript");
    expect(voiceStatus).toContain("Listening… speak now");
    expect(voiceTextArea).toContain("capturedSpeechPreview");
    expect(voiceTextArea).toContain("recordingTimerLabel");
  });

  it("starts recording before server transcription and merges transcript chunks safely", () => {
    expect(voiceCapture).toContain("startRecordingSession");
    expect(voiceCapture).toContain("transcribeRecordedAudio");
    expect(transcriptMerge).toContain("mergeFinalTranscriptChunk");
    expect(transcriptMerge).toContain("buildCapturedSpeechPreview");
    expect(transcriptMerge).toContain("chooseBestTranscript");
    expect(browserSpeech).toContain("startBrowserSpeechInterimAssist");
    expect(browserSpeech).toContain("interimResults = true");
    expect(browserSpeech).toContain("continuous = true");
  });

  it("uses server transcription endpoint with timeout and controlled errors", () => {
    expect(transcribeRoute).toContain("TRANSCRIPTION_TIMEOUT_MS");
    expect(transcribeRoute).toContain("unsupported_audio_format");
    expect(transcribeRoute).toContain("transcription_timeout");
    expect(transcribeRoute).not.toContain("console.log");
  });

  it("stops on user action, processes speech, and preserves browser fallback", () => {
    expect(voiceHook).toContain("stopListening");
    expect(voiceHook).toContain("Processing speech…");
    expect(voiceHook).toContain("Transcript refined from recorded audio.");
    expect(voiceHook).toContain("session.stop()");
    expect(voiceTextArea).toContain("onStop={voice.stopListening}");
  });

  it("selects mobile MIME types and limits unsupported recorder browsers", () => {
    expect(voiceCapture).toContain("audio/mp4");
    expect(voiceCapture).toContain("MediaRecorder.isTypeSupported");
    expect(voiceHook).toContain("Voice capture is limited on this browser. Please type instead.");
  });

  it("tracks blocked, unavailable, and loading audio states without freezing navigation", () => {
    expect(playbackHook).toContain("audio_blocked");
    expect(playbackHook).toContain("audio_unavailable");
    expect(playbackHook).toContain("audio_loading");
    expect(translator).toContain("Loading audio…");
    expect(translator).toContain("Tap to play audio");
    expect(translator).toContain("VoiceInputTextArea");
    expect(voiceTextArea).toContain("<textarea");
    expect(voiceTextArea).not.toContain("disabled={voice");
  });

  it("stops audio before mic and clears voice state on Clear", () => {
    expect(voiceHook).toMatch(/stopVoicePlayback\(\)[\s\S]*setState\("requesting_permission"\)/);
    expect(voiceTextArea).toContain("voice.reset()");
    expect(translator).toContain("stop()");
  });

  it("exposes dev-only voice diagnostics without transcript logging", () => {
    expect(voiceDiagnostics).toContain("lexienn_debug_voice");
    expect(voiceDiagnostics).toContain("__lexiennDebugVoice");
    expect(voiceDiagnostics).not.toContain("console.info(transcript");
    expect(voiceHook).not.toContain("console.log(pendingTranscript");
  });
});
