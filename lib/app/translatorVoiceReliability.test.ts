import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("translator voice reliability regression", () => {
  const voiceHook = readFileSync("hooks/useVoiceInput.ts", "utf8");
  const voiceButton = readFileSync("components/speech/VoiceInputButton.tsx", "utf8");
  const voiceStatus = readFileSync("components/speech/VoiceInputStatus.tsx", "utf8");
  const voiceTextArea = readFileSync("components/speech/VoiceInputTextArea.tsx", "utf8");
  const browserSpeech = readFileSync("lib/speech/browserSpeechRecognition.ts", "utf8");
  const translator = readFileSync("components/translator/TextTranslatorView.tsx", "utf8");
  const playbackHook = readFileSync("lib/voice/useVoicePlayback.ts", "utf8");
  const audioPlayback = readFileSync("lib/voice/audioPlayback.ts", "utf8");
  const voiceDiagnostics = readFileSync("lib/app/voiceDiagnostics.ts", "utf8");
  const schemas = readFileSync("lib/speech/speechInputSchemas.ts", "utf8");

  it("defines the required voice input states", () => {
    expect(schemas).toContain('"requesting_permission"');
    expect(schemas).toContain('"listening"');
    expect(schemas).toContain('"processing_speech"');
    expect(schemas).toContain('"speech_ready"');
    expect(schemas).toContain('"speech_error"');
    expect(schemas).toContain('"unsupported"');
  });

  it("shows listening UI immediately on mic tap before async recognition work", () => {
    expect(voiceHook).toContain('setState("requesting_permission")');
    expect(voiceHook).toContain('setState("listening")');
    expect(voiceHook).toContain('setStatusMessage({ body: "Listening…" })');
    expect(voiceHook).toContain("logVoiceDiagnostic");
    expect(voiceHook).toContain("stopVoicePlayback");
  });

  it("exposes stopListening and preserves transcript on stop", () => {
    expect(voiceHook).toContain("stopListening");
    expect(voiceHook).toContain("Voice input stopped.");
    expect(voiceHook).toContain("commitTranscript");
    expect(voiceTextArea).toContain("onStop={voice.stopListening}");
  });

  it("renders a visible Stop button with type=button during recording", () => {
    expect(voiceButton).toContain('type="button"');
    expect(voiceButton).toContain('aria-label="Stop voice input"');
    expect(voiceButton).toContain("Stop");
    expect(voiceButton).toContain("onStop");
    expect(voiceStatus).toContain("Stop");
    expect(voiceStatus).toContain('type="button"');
  });

  it("supports interim and final transcript rendering", () => {
    expect(browserSpeech).toContain("interimResults = true");
    expect(browserSpeech).toContain("continuous = true");
    expect(browserSpeech).toContain("onInterim");
    expect(browserSpeech).toContain("onFinal");
    expect(browserSpeech).toContain("appendTranscript");
    expect(voiceHook).toContain("interimTranscript");
    expect(voiceHook).toContain("setInterimTranscript");
    expect(voiceStatus).toContain("interimTranscript");
    expect(voiceStatus).toContain("Live transcript");
    expect(voiceStatus).toContain("Listening… speak now");
  });

  it("clears active recognition on Clear and keeps typing workflow available", () => {
    expect(voiceTextArea).toContain("voice.reset()");
    expect(voiceTextArea).toContain("<textarea");
    expect(voiceHook).toContain("reset");
    expect(voiceStatus).toContain("Continue typing");
    expect(voiceHook).toContain(
      "Voice input is not supported in this browser. You can type instead.",
    );
  });

  it("stops audio before microphone capture starts", () => {
    expect(voiceHook).toContain("stopVoicePlayback()");
    expect(voiceHook).toMatch(/stopVoicePlayback\(\)[\s\S]*setState\("requesting_permission"\)/);
  });

  it("tracks audio loading, playing, and error states with generation guards", () => {
    expect(playbackHook).toContain('"audio_loading"');
    expect(playbackHook).toContain('"audio_playing"');
    expect(playbackHook).toContain('"audio_error"');
    expect(playbackHook).toContain("playGenerationRef");
    expect(playbackHook).toContain("TTS_REQUEST_TIMEOUT_MS");
    expect(playbackHook).toContain("AUDIO_PLAYBACK_ERROR_MESSAGE");
    expect(audioPlayback).toContain("PLAYBACK_START_TIMEOUT_MS");
    expect(audioPlayback).toContain("AutoplayBlockedError");
    expect(audioPlayback).toContain("audio.play()");
  });

  it("shows controlled audio errors and immediate loading feedback in translator", () => {
    expect(translator).toContain("audioState");
    expect(translator).toContain("Loading audio…");
    expect(translator).toContain("Play translation audio");
    expect(translator).toContain("audio_error");
    expect(translator).toContain("stop()");
  });

  it("does not log spoken text in production voice diagnostics", () => {
    expect(voiceDiagnostics).toContain("lexienn_debug_voice");
    expect(voiceDiagnostics).toContain("[lexienn-voice]");
    expect(voiceDiagnostics).not.toContain("console.info(transcript");
    expect(voiceDiagnostics).not.toContain("input_text");
    expect(voiceHook).not.toContain("console.log(pendingTranscript");
    expect(voiceHook).not.toContain("console.log(interimTranscript");
  });

  it("maps no-speech and permission failures to controlled messages", () => {
    expect(voiceHook).toContain("No speech detected. Try again.");
    expect(voiceHook).toContain("Microphone permission was denied.");
    expect(browserSpeech).toContain('event.error === "no-speech"');
    expect(browserSpeech).toContain('event.error === "not-allowed"');
  });
});
