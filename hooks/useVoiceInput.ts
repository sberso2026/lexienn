"use client";

import { useCallback, useRef, useState } from "react";
import { detectClientPlatform } from "@/lib/platform/detectClientPlatform";
import {
  micErrorCodeToVoiceInputState,
  getMicErrorMessage,
  getMicPreflightHint,
  type MicUserMessage,
} from "@/lib/speech/micPermissionMessages";
import { requestMicPermissionPreflight } from "@/lib/speech/requestMicPermission";
import {
  SpeechToTextApiError,
  isBrowserOnline,
  isBrowserSpeechRecognitionSupported,
  transcribeSpeechInput,
} from "@/lib/speech/speechToTextClient";
import type { SpeechInputTarget, VoiceInputState } from "@/lib/speech/speechInputSchemas";
import type { UserContext } from "@/lib/schemas";

export type UseVoiceInputOptions = {
  languageHint: string;
  userContext: UserContext;
  inputTarget: SpeechInputTarget;
  onTranscript?: (text: string) => void;
  timeoutMs?: number;
};

export function useVoiceInput({
  languageHint,
  userContext,
  inputTarget,
  onTranscript,
  timeoutMs = 20_000,
}: UseVoiceInputOptions) {
  const [state, setState] = useState<VoiceInputState>("idle");
  const [pendingTranscript, setPendingTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState<MicUserMessage | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isSupported =
    isBrowserOnline() &&
    typeof navigator !== "undefined" &&
    (Boolean(navigator.mediaDevices?.getUserMedia) ||
      isBrowserSpeechRecognitionSupported());

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
    setPendingTranscript("");
    setStatusMessage(null);
  }, []);

  const setMicFailure = useCallback((errorCode: Parameters<typeof getMicErrorMessage>[0]) => {
    const platform = detectClientPlatform();
    setState(micErrorCodeToVoiceInputState(errorCode));
    setStatusMessage(getMicErrorMessage(errorCode, platform));
  }, []);

  const startListening = useCallback(async () => {
    if (typeof window === "undefined") {
      setState("unsupported");
      setStatusMessage({
        body: "Voice typing is not supported in this browser yet. You can type manually.",
      });
      return;
    }

    if (!window.isSecureContext) {
      setMicFailure("insecure_context_or_policy_block");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicFailure("mic_not_supported");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const platform = detectClientPlatform();
    setPendingTranscript("");
    setStatusMessage({ body: getMicPreflightHint(platform) });
    setState("listening");

    const preflight = await requestMicPermissionPreflight();
    if (controller.signal.aborted) return;

    if (!preflight.ok) {
      setMicFailure(preflight.errorCode);
      return;
    }

    try {
      if (!isBrowserSpeechRecognitionSupported()) {
        setState("processing");
      }

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
            "Voice typing is not supported in this browser yet. You can type manually.",
        });
        return;
      }

      setPendingTranscript(result.transcript);
      setState("ready");
      if (result.warnings.length > 0) {
        setStatusMessage({ body: result.warnings.join(" ") });
      } else {
        setStatusMessage(null);
      }
    } catch (error) {
      if (controller.signal.aborted) return;

      if (error instanceof SpeechToTextApiError) {
        if (error.micErrorCode) {
          setMicFailure(error.micErrorCode);
          return;
        }
        setState("error");
        setStatusMessage({ body: error.message });
        return;
      }

      setState("error");
      setStatusMessage({
        body:
          error instanceof Error
            ? error.message
            : "Voice input failed. Try again or continue typing.",
      });
    }
  }, [inputTarget, languageHint, setMicFailure, timeoutMs, userContext]);

  const applyTranscript = useCallback(() => {
    if (!pendingTranscript.trim()) return;
    onTranscript?.(pendingTranscript.trim());
    reset();
  }, [onTranscript, pendingTranscript, reset]);

  const dismiss = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
    setPendingTranscript("");
    setStatusMessage(null);
  }, []);

  return {
    state,
    pendingTranscript,
    statusMessage,
    isSupported,
    startListening,
    applyTranscript,
    dismiss,
    reset,
  };
}
