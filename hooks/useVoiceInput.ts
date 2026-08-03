"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  installVoiceDiagnostics,
  logVoiceDiagnostic,
  updateVoiceDebugSnapshot,
} from "@/lib/app/voiceDiagnostics";
import { detectClientPlatform } from "@/lib/platform/detectClientPlatform";
import {
  micErrorCodeToVoiceInputState,
  getMicErrorMessage,
  getMicPreflightHint,
  type MicUserMessage,
} from "@/lib/speech/micPermissionMessages";
import { requestMicPermissionPreflight } from "@/lib/speech/requestMicPermission";
import { isBrowserSpeechRecognitionSupported } from "@/lib/speech/browserSpeechRecognition";
import { SpeechToTextApiError, isBrowserOnline } from "@/lib/speech/speechToTextClient";
import { resolveSpeechCaptureLanguagePlan } from "@/lib/speech/resolveSpeechCaptureLanguage";
import type { SpeechInputTarget, VoiceInputState } from "@/lib/speech/speechInputSchemas";
import type { UserContext } from "@/lib/schemas";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";
import {
  isMediaRecorderSupported,
  preferMobileRecordedTranscription,
  startVoiceCapture,
  type VoiceCaptureSession,
} from "@/lib/voice/voiceCapture";
import {
  acquireMicSession,
  releaseMicSession,
} from "@/lib/voice/micSessionCoordinator";
import { logMicSessionDebug } from "@/lib/voice/micSessionDebug";
import { VoiceTranscribeApiError } from "@/lib/voice/voiceTranscribeClient";
import type { SpokenLanguageDetectionResult } from "@/lib/languages/spokenLanguageDetection";
import { buildSpokenLanguageDetectionResult } from "@/lib/languages/spokenLanguageDetection";

export type UseVoiceInputOptions = {
  languageHint: string;
  userContext: UserContext;
  inputTarget: SpeechInputTarget;
  /** Stable id for Conversation sides (e.g. conversation:a). */
  sessionOwnerId?: string;
  onTranscript?: (text: string) => void;
  onLanguageDetection?: (detection: SpokenLanguageDetectionResult) => void;
  /** Called when this instance begins listening (other sides can clear errors). */
  onSessionStart?: () => void;
  timeoutMs?: number;
};

function mapSpeechErrorMessage(error: unknown): MicUserMessage {
  const message = error instanceof Error ? error.message : "Voice input failed.";
  if (message.includes("permission denied") || message.includes("not-allowed")) {
    return {
      title: "Permission blocked",
      body: "Microphone permission was denied. You can keep using typed text.",
    };
  }
  if (message.includes("No speech was detected") || message.includes("no-speech")) {
    return {
      title: "No speech detected",
      body: "Try again or type manually. Hold the phone closer if needed.",
    };
  }
  if (message.includes("audio-capture") || message.includes("unavailable")) {
    return {
      title: "Microphone unavailable",
      body: "Try again or type manually.",
    };
  }
  if (message.includes("network") || message.includes("aborted")) {
    return {
      title: "Poor audio detected",
      body: "Reduce background noise and try again, or use typed text.",
    };
  }
  if (message.includes("limited on this browser")) {
    return { body: "Voice capture is limited on this browser. Please type instead." };
  }
  if (message.includes("cancelled") || message.includes("stopped")) {
    return { body: "Voice input stopped." };
  }
  if (message.includes("not supported")) {
    return {
      title: "Voice unavailable",
      body: "Voice input is not supported in this browser. You can type instead.",
    };
  }
  if (error instanceof VoiceTranscribeApiError) {
    if (error.code === "transcription_provider_unavailable") {
      return { body: "Voice transcription isn’t available right now. You can type instead." };
    }
    if (error.code === "transcription_timeout") {
      return { body: "Speech took too long. Try again or type instead." };
    }
    if (error.code === "unsupported_audio_format") {
      return { body: "This browser audio format is not supported for transcription." };
    }
  }
  return { body: "Try again or type manually." };
}

function formatRecordingTimer(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function capturePathLabel(
  preferRecorded: boolean,
  captureMode: string | null,
): "browser" | "server" | "hybrid" {
  if (captureMode === "hybrid_mobile") return "hybrid";
  if (captureMode === "recorded_audio_transcription" || preferRecorded) return "server";
  return "browser";
}

export function useVoiceInput({
  languageHint,
  userContext,
  inputTarget,
  sessionOwnerId,
  onTranscript,
  onLanguageDetection,
  onSessionStart,
  timeoutMs = 60_000,
}: UseVoiceInputOptions) {
  const reactId = useId();
  const ownerId = sessionOwnerId ?? `voice:${reactId}`;
  const [state, setState] = useState<VoiceInputState>("idle");
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [capturedSpeechPreview, setCapturedSpeechPreview] = useState("");
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [statusMessage, setStatusMessage] = useState<MicUserMessage | null>(null);
  const captureSessionRef = useRef<VoiceCaptureSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stoppingRef = useRef(false);
  const languageHintRef = useRef(languageHint);
  languageHintRef.current = languageHint;

  const isSupported =
    isBrowserOnline() &&
    typeof navigator !== "undefined" &&
    (isMediaRecorderSupported() ||
      Boolean(navigator.mediaDevices?.getUserMedia) ||
      isBrowserSpeechRecognitionSupported());

  useEffect(() => {
    installVoiceDiagnostics();
    updateVoiceDebugSnapshot({
      mediaRecorderSupported: isMediaRecorderSupported(),
      speechRecognitionSupported: isBrowserSpeechRecognitionSupported(),
    });
  }, []);

  const hardStopSession = useCallback(() => {
    stoppingRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    captureSessionRef.current?.abort();
    captureSessionRef.current = null;
    releaseMicSession(ownerId);
  }, [ownerId]);

  useEffect(() => {
    return () => {
      hardStopSession();
    };
  }, [hardStopSession]);

  const resetTransientErrorOnly = useCallback(() => {
    setState("idle");
    setStatusMessage(null);
    setPendingTranscript("");
    setInterimTranscript("");
    setCapturedSpeechPreview("");
    setRecordingElapsedMs(0);
  }, []);

  const reset = useCallback(() => {
    logVoiceDiagnostic("stop_tap", { code: "reset" });
    hardStopSession();
    resetTransientErrorOnly();
    updateVoiceDebugSnapshot({ voiceState: "idle", captureMode: null, selectedMimeType: null });
  }, [hardStopSession, resetTransientErrorOnly]);

  const setMicFailure = useCallback(
    (errorCode: Parameters<typeof getMicErrorMessage>[0]) => {
      const platform = detectClientPlatform();
      const plan = resolveSpeechCaptureLanguagePlan(languageHintRef.current);
      setState(micErrorCodeToVoiceInputState(errorCode));
      setStatusMessage(getMicErrorMessage(errorCode, platform));
      logVoiceDiagnostic("recognition_error", { code: errorCode });
      logMicSessionDebug({
        side: ownerId,
        selectedLanguage: plan.selectedLanguage,
        resolvedLocale: plan.resolvedBrowserLocale,
        path: capturePathLabel(plan.preferRecordedTranscription, null),
        errorCode,
        event: "mic_failure",
      });
      updateVoiceDebugSnapshot({ voiceState: micErrorCodeToVoiceInputState(errorCode) });
      hardStopSession();
      if (errorCode === "mic_permission_denied") {
        void import("@/lib/analytics/appEvents").then(({ trackAppEvent }) => {
          trackAppEvent("microphone_permission_denied");
        });
      }
    },
    [hardStopSession, ownerId],
  );

  const commitTranscript = useCallback(
    (text: string, refinedFromServer = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setPendingTranscript(trimmed);
      setCapturedSpeechPreview(trimmed);
      setInterimTranscript("");
      onTranscript?.(trimmed);
      logVoiceDiagnostic("final_result");
      if (refinedFromServer) {
        setStatusMessage({ body: "Transcript refined from recorded audio." });
      }
    },
    [onTranscript],
  );

  const stopListening = useCallback(() => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    logVoiceDiagnostic("stop_tap");
    setState("processing_speech");
    setStatusMessage({ body: "Processing speech…" });
    updateVoiceDebugSnapshot({ voiceState: "processing_speech" });

    void (async () => {
      const session = captureSessionRef.current;
      const plan = resolveSpeechCaptureLanguagePlan(languageHintRef.current);
      if (!session) {
        stoppingRef.current = false;
        setState("idle");
        releaseMicSession(ownerId);
        return;
      }

      logVoiceDiagnostic("transcription_start");
      try {
        const result = await session.stop();
        logVoiceDiagnostic("transcription_end", { durationMs: result.durationMs });
        commitTranscript(result.transcript, result.refinedFromServer);
        if (result.detectedLanguageCode || result.confidence != null) {
          onLanguageDetection?.(
            buildSpokenLanguageDetectionResult({
              transcript: result.transcript,
              providerLanguage: result.detectedLanguageCode,
              confidence: result.confidence ?? null,
              source: result.source === "server_transcription" ? "server_stt" : "browser",
              durationMs: result.durationMs,
            }),
          );
        }
        setState("speech_ready");
        if (!result.refinedFromServer) {
          setStatusMessage({ body: "Voice input stopped." });
        }
        logMicSessionDebug({
          side: ownerId,
          selectedLanguage: plan.selectedLanguage,
          resolvedLocale: plan.resolvedBrowserLocale,
          path: capturePathLabel(plan.preferRecordedTranscription, result.captureMode),
          event: "session_success",
        });
        updateVoiceDebugSnapshot({
          voiceState: "speech_ready",
          captureMode: result.captureMode,
          selectedMimeType: result.mimeType ?? session.selectedMimeType,
        });
      } catch (error) {
        const preview = session.getPreview().capturedSpeechPreview;
        if (preview.trim()) {
          commitTranscript(preview);
          setState("speech_ready");
          setStatusMessage({ body: "Voice input stopped." });
        } else {
          setState("speech_error");
          setStatusMessage(mapSpeechErrorMessage(error));
          logVoiceDiagnostic("recognition_error", {
            code: error instanceof Error ? error.name : "unknown",
          });
          logMicSessionDebug({
            side: ownerId,
            selectedLanguage: plan.selectedLanguage,
            resolvedLocale: plan.resolvedBrowserLocale,
            path: capturePathLabel(plan.preferRecordedTranscription, session.captureMode),
            errorCode: error instanceof Error ? error.message : "unknown",
            event: "session_error",
          });
        }
      } finally {
        captureSessionRef.current = null;
        abortRef.current = null;
        stoppingRef.current = false;
        releaseMicSession(ownerId);
      }
    })();
  }, [commitTranscript, onLanguageDetection, ownerId]);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") {
      setState("unsupported");
      setStatusMessage({
        body: "Voice input is not supported in this browser. You can type instead.",
      });
      return;
    }

    const plan = resolveSpeechCaptureLanguagePlan(languageHintRef.current);
    logVoiceDiagnostic("mic_tap");
    stopVoicePlayback();
    onSessionStart?.();

    if (!window.isSecureContext) {
      setMicFailure("insecure_context_or_policy_block");
      return;
    }

    if (!isMediaRecorderSupported() && !isBrowserSpeechRecognitionSupported()) {
      setState("unsupported");
      setStatusMessage({
        body: "Voice capture is limited on this browser. Please type instead.",
      });
      return;
    }

    // Always tear down any prior session (this side or coordinator-released peer).
    hardStopSession();

    const controller = new AbortController();
    abortRef.current = controller;
    stoppingRef.current = false;

    // Clear only this side's transient mic UI state — never wipe parent typed text.
    setPendingTranscript("");
    setInterimTranscript("");
    setCapturedSpeechPreview("");
    setRecordingElapsedMs(0);
    setStatusMessage({ body: "Listening…" });
    setState("requesting_permission");
    logVoiceDiagnostic("ui_listening");
    updateVoiceDebugSnapshot({ voiceState: "requesting_permission" });

    acquireMicSession(ownerId, () => {
      hardStopSession();
      setState("idle");
      setStatusMessage(null);
    });

    logMicSessionDebug({
      side: ownerId,
      selectedLanguage: plan.selectedLanguage,
      resolvedLocale: plan.resolvedBrowserLocale,
      path: capturePathLabel(plan.preferRecordedTranscription, null),
      event: "session_start",
    });

    void (async () => {
      const platform = detectClientPlatform();
      setState("listening");
      updateVoiceDebugSnapshot({ voiceState: "listening" });

      if (navigator.mediaDevices) {
        const preflight = await requestMicPermissionPreflight();
        if (controller.signal.aborted) return;
        if (!preflight.ok) {
          setMicFailure(preflight.errorCode);
          return;
        }
      }

      const useRecorded =
        plan.preferRecordedTranscription || preferMobileRecordedTranscription();

      setStatusMessage((current) =>
        current?.body === "Listening…"
          ? {
              body: useRecorded
                ? "Listening… recording audio for reliable capture."
                : getMicPreflightHint(platform),
            }
          : current,
      );

      try {
        const serverLanguageHint = plan.whisperLanguageHint ?? "auto";
        const session = startVoiceCapture(
          {
            languageHint: serverLanguageHint,
            browserLocaleHint: plan.resolvedBrowserLocale,
            preferRecordedTranscription: useRecorded,
            userContext,
            inputTarget,
            maxDurationMs: timeoutMs,
          },
          {
            onRecorderStart: () => logVoiceDiagnostic("recorder_start"),
            onRecognitionStart: () => logVoiceDiagnostic("recognition_start"),
            onInterim: ({
              finalTranscript,
              interimTranscript: interim,
              capturedSpeechPreview: preview,
            }) => {
              if (interim.trim()) logVoiceDiagnostic("first_interim");
              setFinalIfChanged(finalTranscript);
              setInterimTranscript(interim);
              setCapturedSpeechPreview(preview);
            },
            onTimer: (elapsedMs) => setRecordingElapsedMs(elapsedMs),
          },
          controller.signal,
        );

        captureSessionRef.current = session;
        updateVoiceDebugSnapshot({
          captureMode: session.captureMode,
          selectedMimeType: session.selectedMimeType,
        });

        await session.ready;

        if (controller.signal.aborted || captureSessionRef.current !== session) return;

        if (session.completion) {
          void session.completion
            .then((result) => {
              if (controller.signal.aborted || captureSessionRef.current !== session) return;
              commitTranscript(result.transcript, result.refinedFromServer);
              setState("speech_ready");
              setStatusMessage(null);
              captureSessionRef.current = null;
              releaseMicSession(ownerId);
            })
            .catch((error) => {
              if (controller.signal.aborted || captureSessionRef.current !== session) return;
              const preview = session.getPreview().capturedSpeechPreview;
              if (preview.trim()) {
                commitTranscript(preview);
                setState("speech_ready");
                setStatusMessage({ body: "Voice input stopped." });
              } else {
                setState("speech_error");
                setStatusMessage(mapSpeechErrorMessage(error));
                logMicSessionDebug({
                  side: ownerId,
                  selectedLanguage: plan.selectedLanguage,
                  resolvedLocale: plan.resolvedBrowserLocale,
                  path: capturePathLabel(useRecorded, session.captureMode),
                  errorCode: error instanceof Error ? error.message : "unknown",
                  event: "session_error",
                });
              }
              captureSessionRef.current = null;
              releaseMicSession(ownerId);
            });
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        if (error instanceof SpeechToTextApiError) {
          if (error.micErrorCode) {
            setMicFailure(error.micErrorCode);
            return;
          }
        }

        setState("speech_error");
        setStatusMessage(mapSpeechErrorMessage(error));
        logVoiceDiagnostic("recognition_error", {
          code: error instanceof Error ? error.name : "unknown",
        });
        logMicSessionDebug({
          side: ownerId,
          selectedLanguage: plan.selectedLanguage,
          resolvedLocale: plan.resolvedBrowserLocale,
          path: capturePathLabel(plan.preferRecordedTranscription, null),
          errorCode: error instanceof Error ? error.message : "unknown",
          event: "session_error",
        });
        hardStopSession();
      }
    })();
  }, [
    commitTranscript,
    hardStopSession,
    inputTarget,
    onSessionStart,
    ownerId,
    setMicFailure,
    timeoutMs,
    userContext,
  ]);

  function setFinalIfChanged(finalTranscript: string) {
    setPendingTranscript((previous) =>
      previous === finalTranscript ? previous : finalTranscript,
    );
  }

  const applyTranscript = useCallback(() => {
    if (!pendingTranscript.trim()) return;
    onTranscript?.(pendingTranscript.trim());
    reset();
  }, [onTranscript, pendingTranscript, reset]);

  const dismiss = useCallback(() => {
    reset();
  }, [reset]);

  const isRecording =
    state === "requesting_permission" ||
    state === "listening" ||
    state === "processing_speech";

  return {
    state,
    pendingTranscript,
    interimTranscript,
    capturedSpeechPreview,
    recordingTimerLabel: formatRecordingTimer(recordingElapsedMs),
    statusMessage,
    isSupported,
    isRecording,
    startListening,
    stopListening,
    applyTranscript,
    dismiss,
    reset,
    /** Clear error UI without touching parent typed text. */
    clearError: resetTransientErrorOnly,
    hardStopSession,
  };
}
