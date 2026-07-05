import {
  getSpeechInputConfig,
  getSpeechInputTimeoutMs,
} from "@/lib/speech/speechInputConfig";
import type { SpeechInputTarget } from "@/lib/speech/speechInputSchemas";
import type { UserContext } from "@/lib/schemas";

export type CloudTranscribeRequest = {
  audioBuffer: Buffer;
  mimeType: string;
  language_hint: string;
  user_context: UserContext;
  input_target: SpeechInputTarget;
};

export type CloudTranscribeResult = {
  transcript: string;
  detected_language?: string;
  confidence_score: number;
  warnings: string[];
};

function mapLanguageHintToWhisper(languageHint: string): string | undefined {
  const normalized = languageHint.trim().toLowerCase();
  if (!normalized) return undefined;
  return normalized.split("-")[0];
}

export async function transcribeAudioCloud(
  request: CloudTranscribeRequest,
): Promise<CloudTranscribeResult> {
  const config = getSpeechInputConfig();

  if (!config.enabled) {
    return {
      transcript: "Voice input unavailable. Please type manually.",
      confidence_score: 0,
      warnings: ["Speech input is disabled."],
    };
  }

  if (!config.isConfigured) {
    return {
      transcript: "Voice input unavailable. Please type manually.",
      confidence_score: 0,
      warnings: ["Cloud speech-to-text is not configured."],
    };
  }

  const apiKey = process.env.AI_API_KEY?.trim() ?? "";
  const timeoutMs = getSpeechInputTimeoutMs();
  const whisperLanguage = mapLanguageHintToWhisper(request.language_hint);

  const extension = request.mimeType.includes("mp4")
    ? "m4a"
    : request.mimeType.includes("ogg")
      ? "ogg"
      : "webm";

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(request.audioBuffer)], { type: request.mimeType });
  formData.append("file", blob, `speech.${extension}`);
  formData.append("model", config.model);
  if (whisperLanguage) {
    formData.append("language", whisperLanguage);
  }
  formData.append(
    "prompt",
    `Transcribe spoken ${request.input_target} input for ${request.user_context} context.`,
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        transcript: "Voice input unavailable. Please type manually.",
        confidence_score: 0,
        warnings: ["Cloud speech-to-text request failed."],
      };
    }

    const payload = (await response.json()) as { text?: string; language?: string };
    const transcript = payload.text?.trim() ?? "";

    if (!transcript) {
      return {
        transcript: "Voice input unavailable. Please type manually.",
        confidence_score: 0,
        warnings: ["No speech was detected."],
      };
    }

    return {
      transcript,
      detected_language: payload.language ?? whisperLanguage,
      confidence_score: 0.85,
      warnings: [],
    };
  } catch {
    return {
      transcript: "Voice input unavailable. Please type manually.",
      confidence_score: 0,
      warnings: ["Cloud speech-to-text timed out or failed."],
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
