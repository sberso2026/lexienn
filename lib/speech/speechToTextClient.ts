import { classifyMicError } from "@/lib/speech/classifyMicError";
import { transcribeWithBrowserSpeech, isBrowserSpeechRecognitionSupported } from "@/lib/speech/browserSpeechRecognition";
import { recordAudioBlob } from "@/lib/speech/audioCapture";
import type {
  SpeechInputTarget,
  SpeechTranscribeResponse,
} from "@/lib/speech/speechInputSchemas";
import {
  speechTranscribeErrorSchema,
  speechTranscribeResponseSchema,
} from "@/lib/speech/speechInputSchemas";
import type { MicErrorCode } from "@/lib/speech/classifyMicError";
import type { UserContext } from "@/lib/schemas";

export class SpeechToTextApiError extends Error {
  details?: Array<{ path: string; message: string }>;
  micErrorCode?: MicErrorCode;

  constructor(
    message: string,
    options?: {
      details?: Array<{ path: string; message: string }>;
      micErrorCode?: MicErrorCode;
    },
  ) {
    super(message);
    this.name = "SpeechToTextApiError";
    this.details = options?.details;
    this.micErrorCode = options?.micErrorCode;
  }
}

export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export type SpeechInputClientRequest = {
  language_hint: string;
  user_context: UserContext;
  input_target: SpeechInputTarget;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Set when getUserMedia preflight already succeeded in the click handler. */
  micPermissionPreflightPassed?: boolean;
};

export async function transcribeSpeechInput(
  request: SpeechInputClientRequest,
): Promise<SpeechTranscribeResponse> {
  if (isBrowserSpeechRecognitionSupported()) {
    try {
      const browserResult = await transcribeWithBrowserSpeech({
        languageHint: request.language_hint,
        timeoutMs: request.timeoutMs,
        signal: request.signal,
      });

      return speechTranscribeResponseSchema.parse({
        transcript: browserResult.transcript,
        detected_language: browserResult.detected_language,
        confidence_score: browserResult.confidence_score,
        source: "browser_speech",
        warnings: [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Browser speech failed.";
      if (
        !request.micPermissionPreflightPassed &&
        (message.includes("permission denied") || message.includes("not-allowed"))
      ) {
        throw new SpeechToTextApiError(message, {
          micErrorCode: "mic_permission_denied",
        });
      }
      if (!isBrowserOnline()) {
        return unavailableResponse(
          "Voice input unavailable offline in this browser. Please type manually.",
        );
      }
    }
  } else if (!isBrowserOnline()) {
    return unavailableResponse(
      "Voice input unavailable offline in this browser. Please type manually.",
    );
  }

  if (!isBrowserOnline()) {
    return unavailableResponse(
      "Voice input unavailable offline in this browser. Please type manually.",
    );
  }

  try {
    const audioBlob = await recordAudioBlob({
      maxDurationMs: request.timeoutMs ?? 20_000,
      signal: request.signal,
    });

    const formData = new FormData();
    formData.append("audio", audioBlob, "speech.webm");
    formData.append("language_hint", request.language_hint);
    formData.append("user_context", request.user_context);
    formData.append("input_target", request.input_target);

    const response = await fetch("/api/speech/transcribe", {
      method: "POST",
      body: formData,
      signal: request.signal,
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const parsedError = speechTranscribeErrorSchema.safeParse(payload);
      if (parsedError.success) {
        throw new SpeechToTextApiError(parsedError.data.error, {
          details: parsedError.data.details,
        });
      }
      throw new SpeechToTextApiError("Voice transcription failed.");
    }

    const parsed = speechTranscribeResponseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new SpeechToTextApiError("Received an invalid speech transcription response.");
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof SpeechToTextApiError) throw error;
    const micErrorCode = classifyMicError(error);
    if (micErrorCode === "mic_permission_denied" && request.micPermissionPreflightPassed) {
      throw new SpeechToTextApiError("Microphone access failed after permission was granted.", {
        micErrorCode: "mic_in_use_or_unavailable",
      });
    }
    if (
      micErrorCode === "mic_permission_denied" ||
      micErrorCode === "no_microphone_found" ||
      micErrorCode === "mic_not_supported" ||
      micErrorCode === "insecure_context_or_policy_block"
    ) {
      throw new SpeechToTextApiError("Voice input failed.", { micErrorCode });
    }
    if (error instanceof Error && error.message.includes("not supported")) {
      return unavailableResponse(
        "Voice typing is not supported in this browser yet. You can type manually.",
      );
    }
    throw new SpeechToTextApiError(
      error instanceof Error ? error.message : "Voice input failed.",
    );
  }
}

function unavailableResponse(reason: string): SpeechTranscribeResponse {
  return speechTranscribeResponseSchema.parse({
    transcript: "Voice input unavailable. Please type manually.",
    confidence_score: 0,
    source: "unavailable",
    warnings: [reason],
    unavailable_reason: reason,
  });
}

export async function fetchSpeechInputStatus(): Promise<{
  speech_input_enabled: boolean;
  provider_configured: boolean;
  browser_speech_available: boolean;
  fallback_enabled: boolean;
}> {
  if (isBrowserSpeechRecognitionSupported()) {
    return {
      speech_input_enabled: true,
      provider_configured: false,
      browser_speech_available: true,
      fallback_enabled: true,
    };
  }

  const response = await fetch("/api/speech/status");
  if (!response.ok) {
    return {
      speech_input_enabled: false,
      provider_configured: false,
      browser_speech_available: false,
      fallback_enabled: false,
    };
  }

  return (await response.json()) as {
    speech_input_enabled: boolean;
    provider_configured: boolean;
    browser_speech_available: boolean;
    fallback_enabled: boolean;
  };
}

export { isBrowserSpeechRecognitionSupported };
