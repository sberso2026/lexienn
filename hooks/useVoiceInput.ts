"use client";

import { useCallback, useRef, useState } from "react";
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
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isSupported =
    isBrowserSpeechRecognitionSupported() ||
    (isBrowserOnline() && typeof navigator !== "undefined" && Boolean(navigator.mediaDevices));

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState("idle");
    setPendingTranscript("");
    setStatusMessage(null);
  }, []);

  const startListening = useCallback(async () => {
    if (!isBrowserSpeechRecognitionSupported() && !isBrowserOnline()) {
      setState("unsupported");
      setStatusMessage(
        "Voice input is not supported in this browser. Type manually or use another device.",
      );
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPendingTranscript("");
    setStatusMessage(null);
    setState("listening");

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
      });

      if (controller.signal.aborted) return;

      if (result.source === "unavailable") {
        setState("unsupported");
        setStatusMessage(
          result.unavailable_reason ??
            result.warnings[0] ??
            "Voice input unavailable. Please type manually.",
        );
        return;
      }

      setPendingTranscript(result.transcript);
      setState("ready");
      if (result.warnings.length > 0) {
        setStatusMessage(result.warnings.join(" "));
      }
    } catch (error) {
      if (controller.signal.aborted) return;

      const message =
        error instanceof SpeechToTextApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Voice input failed.";

      if (message.includes("blocked") || message.includes("permission")) {
        setState("permission_denied");
        setStatusMessage(
          "Microphone access was blocked. Enable microphone permission or type manually.",
        );
        return;
      }

      if (message.includes("not supported")) {
        setState("unsupported");
        setStatusMessage(
          "Voice input is not supported in this browser. Type manually or use another device.",
        );
        return;
      }

      setState("error");
      setStatusMessage(message);
    }
  }, [inputTarget, languageHint, timeoutMs, userContext]);

  const applyTranscript = useCallback(() => {
    if (!pendingTranscript.trim()) return;
    onTranscript?.(pendingTranscript.trim());
    reset();
  }, [onTranscript, pendingTranscript, reset]);

  const dismiss = useCallback(() => {
    reset();
  }, [reset]);

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
