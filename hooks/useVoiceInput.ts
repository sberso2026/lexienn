"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import type { SpeechInputTarget, VoiceInputState } from "@/lib/speech/speechInputSchemas";
import type { UserContext } from "@/lib/schemas";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";
import {
  isMediaRecorderSupported,
  preferMobileRecordedTranscription,
  startVoiceCapture,
  type VoiceCaptureSession,
} from "@/lib/voice/voiceCapture";
import { VoiceTranscribeApiError } from "@/lib/voice/voiceTranscribeClient";

export type UseVoiceInputOptions = {
  languageHint: string;
  userContext: UserContext;
  inputTarget: SpeechInputTarget;
  onTranscript?: (text: string) => void;
  timeoutMs?: number;
};

function mapSpeechErrorMessage(error: unknown): MicUserMessage {
  const message = error instanceof Error ? error.message : "Voice input failed.";
  if (message.includes("permission denied") || message.includes("not-allowed")) {
    return { body: "Microphone permission was denied." };
  }
  if (message.includes("No speech was detected")) {
    return { body: "No speech detected. Try again." };
  }
  if (message.includes("limited on this browser")) {
    return { body: "Voice capture is limited on this browser. Please type instead." };
  }
  if (message.includes("cancelled") || message.includes("stopped")) {
    return { body: "Voice input stopped." };
  }
  if (message.includes("not supported")) {
    return { body: "Voice input is not supported in this browser. You can type instead." };
  }
  if (error instanceof VoiceTranscribeApiError) {
    if (error.code === "transcription_provider_unavailable") {
      return { body: "High-reliability mobile transcription is not configured yet." };
    }
    if (error.code === "transcription_timeout") {
      return { body: "Speech processing timed out. Try again or type instead." };
    }
    if (error.code === "unsupported_audio_format") {
      return { body: "This browser audio format is not supported for transcription." };
    }
  }
  return { body: message };
}

function formatRecordingTimer(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function useVoiceInput({
  languageHint,
  userContext,
  inputTarget,
  onTranscript,
  timeoutMs = 60_000,
}: UseVoiceInputOptions) {
  const [state, setState] = useState<VoiceInputState>("idle");
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [capturedSpeechPreview, setCapturedSpeechPreview] = useState("");
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [statusMessage, setStatusMessage] = useState<MicUserMessage | null>(null);
  const captureSessionRef = useRef<VoiceCaptureSession | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stoppingRef = useRef(false);

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

  const reset = useCallback(() => {
    logVoiceDiagnostic("stop_tap", { code: "reset" });
    stoppingRef.current = false;
    abortRef.current?.abort();
    abortRef.current = null;
    captureSessionRef.current?.abort();
    captureSessionRef.current = null;
    setState("idle");
    setPendingTranscript("");
    setInterimTranscript("");
    setCapturedSpeechPreview("");
    setRecordingElapsedMs(0);
    setStatusMessage(null);
    updateVoiceDebugSnapshot({ voiceState: "idle", captureMode: null, selectedMimeType: null });
  }, []);

  const setMicFailure = useCallback((errorCode: Parameters<typeof getMicErrorMessage>[0]) => {
    const platform = detectClientPlatform();
    setState(micErrorCodeToVoiceInputState(errorCode));
    setStatusMessage(getMicErrorMessage(errorCode, platform));
    logVoiceDiagnostic("recognition_error", { code: errorCode });
    updateVoiceDebugSnapshot({ voiceState: micErrorCodeToVoiceInputState(errorCode) });
  }, []);

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
      if (!session) {
        stoppingRef.current = false;
        setState("idle");
        return;
      }

      logVoiceDiagnostic("transcription_start");
      try {
        const result = await session.stop();
        logVoiceDiagnostic("transcription_end", { durationMs: result.durationMs });
        commitTranscript(result.transcript, result.refinedFromServer);
        setState("speech_ready");
        if (!result.refinedFromServer) {
          setStatusMessage({ body: "Voice input stopped." });
        }
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
        }
      } finally {
        captureSessionRef.current = null;
        abortRef.current = null;
        stoppingRef.current = false;
      }
    })();
  }, [commitTranscript]);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") {
      setState("unsupported");
      setStatusMessage({
        body: "Voice input is not supported in this browser. You can type instead.",
      });
      return;
    }

    logVoiceDiagnostic("mic_tap");
    stopVoicePlayback();

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

    abortRef.current?.abort();
    captureSessionRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    stoppingRef.current = false;

    setPendingTranscript("");
    setInterimTranscript("");
    setCapturedSpeechPreview("");
    setRecordingElapsedMs(0);
    setStatusMessage({ body: "Listening…" });
    setState("requesting_permission");
    logVoiceDiagnostic("ui_listening");
    updateVoiceDebugSnapshot({ voiceState: "requesting_permission" });

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

      setStatusMessage((current) =>
        current?.body === "Listening…"
          ? {
              body: preferMobileRecordedTranscription()
                ? "Listening… recording audio for reliable capture."
                : getMicPreflightHint(platform),
            }
          : current,
      );

      try {
        const session = startVoiceCapture(
          {
            languageHint,
            userContext,
            inputTarget,
            maxDurationMs: timeoutMs,
          },
          {
            onRecorderStart: () => logVoiceDiagnostic("recorder_start"),
            onRecognitionStart: () => logVoiceDiagnostic("recognition_start"),
            onInterim: ({ finalTranscript, interimTranscript: interim, capturedSpeechPreview: preview }) => {
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
              }
              captureSessionRef.current = null;
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
      }
    })();
  }, [commitTranscript, inputTarget, languageHint, setMicFailure, timeoutMs, userContext]);

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
  };
}
