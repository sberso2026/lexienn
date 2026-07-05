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
import type { UserContext } from "@/lib/schemas";

export class SpeechToTextApiError extends Error {
  details?: Array<{ path: string; message: string }>;

  constructor(message: string, details?: Array<{ path: string; message: string }>) {
    super(message);
    this.name = "SpeechToTextApiError";
    this.details = details;
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
      if (message.includes("permission denied")) {
        throw new SpeechToTextApiError(
          "Microphone access was blocked. Enable microphone permission or type manually.",
        );
      }
      // Fall through to cloud when online
      if (!isBrowserOnline()) {
        return unavailableResponse(
          "Voice input unavailable offline in this browser. Please type manually.",
        );
      }
    }
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
        throw new SpeechToTextApiError(parsedError.data.error, parsedError.data.details);
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
    const message = error instanceof Error ? error.message : "Voice input failed.";
    if (message.includes("permission") || message.includes("NotAllowedError")) {
      throw new SpeechToTextApiError(
        "Microphone access was blocked. Enable microphone permission or type manually.",
      );
    }
    if (message.includes("not supported")) {
      return unavailableResponse(
        "Voice input is not supported in this browser. Type manually or use another device.",
      );
    }
    throw new SpeechToTextApiError(message);
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
