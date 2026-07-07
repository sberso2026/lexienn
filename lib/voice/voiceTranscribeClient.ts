import type { SpeechInputTarget } from "@/lib/speech/speechInputSchemas";
import type { UserContext } from "@/lib/schemas";

export class VoiceTranscribeApiError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "VoiceTranscribeApiError";
    this.code = code;
  }
}

export type VoiceTranscribeResponse = {
  transcript: string;
  confidence?: number;
  provider: string;
  durationMs: number;
};

const TRANSCRIPTION_TIMEOUT_MS = 15_000;

export async function transcribeRecordedAudio(options: {
  audio: Blob;
  languageHint: string;
  userContext: UserContext;
  inputTarget: SpeechInputTarget;
  durationMs?: number;
  signal?: AbortSignal;
}): Promise<VoiceTranscribeResponse> {
  const formData = new FormData();
  const extension = options.audio.type.includes("mp4")
    ? "m4a"
    : options.audio.type.includes("wav")
      ? "wav"
      : options.audio.type.includes("ogg")
        ? "ogg"
        : "webm";
  formData.append("audio", options.audio, `speech.${extension}`);
  formData.append("language_hint", options.languageHint);
  formData.append("user_context", options.userContext);
  formData.append("input_target", options.inputTarget);
  if (options.durationMs) {
    formData.append("duration_ms", String(options.durationMs));
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS);

  const onAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onAbort);

  try {
    const response = await fetch("/api/voice/transcribe", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const errorBody = payload as { error?: string; code?: string } | null;
      throw new VoiceTranscribeApiError(
        errorBody?.error ?? "Speech transcription failed.",
        errorBody?.code ?? "transcription_failed",
      );
    }

    const parsed = payload as VoiceTranscribeResponse;
    if (!parsed?.transcript?.trim()) {
      throw new VoiceTranscribeApiError("No speech was detected.", "no_speech");
    }

    return parsed;
  } catch (error) {
    if (error instanceof VoiceTranscribeApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new VoiceTranscribeApiError("Speech transcription timed out.", "transcription_timeout");
    }
    throw new VoiceTranscribeApiError(
      error instanceof Error ? error.message : "Speech transcription failed.",
      "transcription_failed",
    );
  } finally {
    window.clearTimeout(timeoutId);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

export async function isServerTranscriptionAvailable(): Promise<boolean> {
  try {
    const response = await fetch("/api/voice/transcribe", { method: "HEAD" });
    return response.status !== 404;
  } catch {
    return true;
  }
}
