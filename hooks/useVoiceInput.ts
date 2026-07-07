"use client";

import { useCallback, useRef, useState } from "react";
import { logVoiceDiagnostic } from "@/lib/app/voiceDiagnostics";
import { detectClientPlatform } from "@/lib/platform/detectClientPlatform";
import {
  micErrorCodeToVoiceInputState,
  getMicErrorMessage,
  getMicPreflightHint,
  type MicUserMessage,
} from "@/lib/speech/micPermissionMessages";
import { requestMicPermissionPreflight } from "@/lib/speech/requestMicPermission";
import {
  startBrowserSpeechSession,
  isBrowserSpeechRecognitionSupported,
} from "@/lib/speech/browserSpeechRecognition";
import {
  SpeechToTextApiError,
  isBrowserOnline,
  transcribeSpeechInput,
} from "@/lib/speech/speechToTextClient";
import type { SpeechInputTarget, VoiceInputState } from "@/lib/speech/speechInputSchemas";
import type { UserContext } from "@/lib/schemas";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";

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
  if (message.includes("cancelled")) {
    return { body: "Voice input stopped." };
  }
  if (message.includes("not supported")) {
    return { body: "Voice input is not supported in this browser. You can type instead." };
  }
  return { body: message };
}

export function useVoiceInput({
  languageHint,
  userContext,
  inputTarget,
  onTranscript,
  timeoutMs = 20_000,
}: UseVoiceInputOptions) {
  const [state, setState] = useState<VoiceInputState>("idle");
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState<MicUserMessage | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionStopRef = useRef<(() => void) | null>(null);
  const finalTranscriptRef = useRef("");
  const firstInterimLoggedRef = useRef(false);

  const isSupported =
    isBrowserOnline() &&
    typeof navigator !== "undefined" &&
    (Boolean(navigator.mediaDevices?.getUserMedia) ||
      isBrowserSpeechRecognitionSupported());

  const reset = useCallback(() => {
    logVoiceDiagnostic("stop_tap", { code: "reset" });
    abortRef.current?.abort();
    abortRef.current = null;
    sessionStopRef.current?.();
    sessionStopRef.current = null;
    finalTranscriptRef.current = "";
    firstInterimLoggedRef.current = false;
    setState("idle");
    setPendingTranscript("");
    setInterimTranscript("");
    setStatusMessage(null);
  }, []);

  const setMicFailure = useCallback((errorCode: Parameters<typeof getMicErrorMessage>[0]) => {
    const platform = detectClientPlatform();
    setState(micErrorCodeToVoiceInputState(errorCode));
    setStatusMessage(getMicErrorMessage(errorCode, platform));
    logVoiceDiagnostic("recognition_error", { code: errorCode });
  }, []);

  const commitTranscript = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      finalTranscriptRef.current = trimmed;
      setPendingTranscript(trimmed);
      setInterimTranscript(trimmed);
      onTranscript?.(trimmed);
      logVoiceDiagnostic("final_result");
    },
    [onTranscript],
  );

  const stopListening = useCallback(() => {
    logVoiceDiagnostic("stop_tap");
    sessionStopRef.current?.();
    sessionStopRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;

    const captured = finalTranscriptRef.current.trim() || interimTranscript.trim();
    if (captured) {
      commitTranscript(captured);
      setState("speech_ready");
      setStatusMessage({ body: "Voice input stopped." });
    } else {
      setState("idle");
      setInterimTranscript("");
      setStatusMessage({ body: "Voice input stopped." });
    }
    logVoiceDiagnostic("recognition_end");
  }, [commitTranscript, interimTranscript]);

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

    if (!navigator.mediaDevices?.getUserMedia && !isBrowserSpeechRecognitionSupported()) {
      setState("unsupported");
      setStatusMessage({
        body: "Voice input is not supported in this browser. You can type instead.",
      });
      return;
    }

    abortRef.current?.abort();
    sessionStopRef.current?.();
    const controller = new AbortController();
    abortRef.current = controller;
    sessionStopRef.current = null;
    finalTranscriptRef.current = "";
    firstInterimLoggedRef.current = false;

    setPendingTranscript("");
    setInterimTranscript("");
    setStatusMessage({ body: "Listening…" });
    setState("requesting_permission");
    logVoiceDiagnostic("ui_listening");

    void (async () => {
      const platform = detectClientPlatform();
      setState("listening");

      if (navigator.mediaDevices) {
        const preflight = await requestMicPermissionPreflight();
        if (controller.signal.aborted) return;

        if (!preflight.ok) {
          setMicFailure(preflight.errorCode);
          return;
        }
      } else if (!isBrowserSpeechRecognitionSupported()) {
        setState("unsupported");
        setStatusMessage({
          body: "Voice input is not supported in this browser. You can type instead.",
        });
        return;
      }

      setStatusMessage((current) =>
        current?.body === "Listening…" ? { body: getMicPreflightHint(platform) } : current,
      );

      try {
        if (isBrowserSpeechRecognitionSupported()) {
          const session = startBrowserSpeechSession({
            languageHint,
            timeoutMs,
            signal: controller.signal,
            onStarted: () => logVoiceDiagnostic("recognition_start"),
            onInterim: (text) => {
              if (!firstInterimLoggedRef.current && text.trim()) {
                firstInterimLoggedRef.current = true;
                logVoiceDiagnostic("first_interim");
              }
              setInterimTranscript(text);
            },
            onFinal: (text) => {
              commitTranscript(text);
            },
          });
          sessionStopRef.current = session.stop;

          const result = await session.promise;
          if (controller.signal.aborted) return;

          commitTranscript(result.transcript);
          setState("speech_ready");
          setStatusMessage(null);
          logVoiceDiagnostic("recognition_end");
          return;
        }

        setState("processing_speech");
        const result = await transcribeSpeechInput({
          language_hint: languageHint,
          user_context: userContext,
          input_target: inputTarget,
          timeoutMs,
          signal: controller.signal,
          micPermissionPreflightPassed: true,
        });

        if (controller.signal.aborted) return;

        if (result.source === "unavailable") {
          setState("unsupported");
          setStatusMessage({
            body:
              result.unavailable_reason ??
              result.warnings[0] ??
              "Voice input is not supported in this browser. You can type instead.",
          });
          return;
        }

        commitTranscript(result.transcript);
        setState("speech_ready");
        setStatusMessage(
          result.warnings.length > 0 ? { body: result.warnings.join(" ") } : null,
        );
        logVoiceDiagnostic("recognition_end");
      } catch (error) {
        if (controller.signal.aborted) return;

        if (error instanceof SpeechToTextApiError) {
          if (error.micErrorCode) {
            setMicFailure(error.micErrorCode);
            return;
          }
          setState("speech_error");
          setStatusMessage({ body: error.message });
          logVoiceDiagnostic("recognition_error", { code: "speech_api_error" });
          return;
        }

        setState("speech_error");
        setStatusMessage(mapSpeechErrorMessage(error));
        logVoiceDiagnostic("recognition_error", {
          code: error instanceof Error ? error.name : "unknown",
        });
      } finally {
        sessionStopRef.current = null;
      }
    })();
  }, [commitTranscript, inputTarget, languageHint, setMicFailure, timeoutMs, userContext]);

  const applyTranscript = useCallback(() => {
    if (!pendingTranscript.trim()) return;
    onTranscript?.(pendingTranscript.trim());
    reset();
  }, [onTranscript, pendingTranscript, reset]);

  const dismiss = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionStopRef.current?.();
    sessionStopRef.current = null;
    finalTranscriptRef.current = "";
    firstInterimLoggedRef.current = false;
    setState("idle");
    setPendingTranscript("");
    setInterimTranscript("");
    setStatusMessage(null);
  }, []);

  const isRecording =
    state === "requesting_permission" ||
    state === "listening" ||
    state === "processing_speech";

  return {
    state,
    pendingTranscript,
    interimTranscript,
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
