import {
  getSpeechInputConfig,
  getSpeechInputTimeoutMs,
} from "@/lib/speech/speechInputConfig";
import type { SpeechInputTarget } from "@/lib/speech/speechInputSchemas";
import type { UserContext } from "@/lib/schemas";
import {
  resolveConstrainedSttLanguage,
  resolveConstrainedSttModel,
} from "@/lib/speech/constrainedSttLanguage";
import {
  buildBisayaSttPrompt,
  buildGenericSttPrompt,
  shouldUseBisayaSttPrompt,
} from "@/lib/speech/bisayaSttPrompt";
import { validateBisayaTranscript, isProviderLanguageAllowedForCebuano } from "@/lib/speech/bisayaTranscriptValidation";
import { isCebuanoLanguageHint } from "@/lib/speech/bisayaStt";

export type CloudTranscribeRequest = {
  audioBuffer: Buffer;
  mimeType: string;
  language_hint: string;
  user_context: UserContext;
  input_target: SpeechInputTarget;
  /** Bounded STT hint terms (no audio). */
  stt_hints?: string[];
};

export type CloudTranscribeResult = {
  transcript: string;
  detected_language?: string;
  confidence_score: number;
  warnings: string[];
  expected_language?: string;
  transport_language?: string | null;
  needs_confirmation?: boolean;
  validation_reason?: string;
  retried?: boolean;
};

/** @deprecated Prefer resolveConstrainedSttLanguage — kept for tests/compat. */
export function mapLanguageHintToWhisper(languageHint: string): string | undefined {
  const plan = resolveConstrainedSttLanguage(languageHint, "whisper-1");
  if (!plan.transportLanguage || plan.expectedLanguage === "auto") return undefined;
  return plan.transportLanguage;
}

async function callOpenAiTranscription(options: {
  apiKey: string;
  model: string;
  audioBuffer: Buffer;
  mimeType: string;
  transportLanguage: string | null;
  prompt: string;
  timeoutMs: number;
}): Promise<{ transcript: string; language?: string; ok: boolean; warning?: string }> {
  const extension = options.mimeType.includes("mp4")
    ? "m4a"
    : options.mimeType.includes("ogg")
      ? "ogg"
      : "webm";

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(options.audioBuffer)], {
    type: options.mimeType,
  });
  formData.append("file", blob, `speech.${extension}`);
  formData.append("model", options.model);
  if (options.transportLanguage) {
    formData.append("language", options.transportLanguage);
  }
  formData.append("prompt", options.prompt);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        transcript: "",
        ok: false,
        warning: "Cloud speech-to-text request failed.",
      };
    }

    const payload = (await response.json()) as { text?: string; language?: string };
    const transcript = payload.text?.trim() ?? "";
    if (!transcript) {
      return {
        transcript: "",
        ok: false,
        warning: "No speech was detected.",
      };
    }

    return {
      transcript,
      language: payload.language,
      ok: true,
    };
  } catch {
    return {
      transcript: "",
      ok: false,
      warning: "Cloud speech-to-text timed out or failed.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
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
  const model = resolveConstrainedSttModel(request.language_hint, config.model);
  const languagePlan = resolveConstrainedSttLanguage(request.language_hint, model);
  const transportLanguage = languagePlan.transportLanguage || null;
  const useBisaya = shouldUseBisayaSttPrompt(request.language_hint);

  const prompt = useBisaya
    ? buildBisayaSttPrompt({ extraHints: request.stt_hints, strongRetry: false })
    : buildGenericSttPrompt(request.input_target, request.user_context);

  const first = await callOpenAiTranscription({
    apiKey,
    model,
    audioBuffer: request.audioBuffer,
    mimeType: request.mimeType,
    transportLanguage,
    prompt,
    timeoutMs,
  });

  if (!first.ok) {
    return {
      transcript: "Voice input unavailable. Please type manually.",
      confidence_score: 0,
      warnings: [first.warning ?? "Cloud speech-to-text request failed."],
      expected_language: languagePlan.expectedLanguage,
      transport_language: transportLanguage,
    };
  }

  let transcript = first.transcript;
  let detectedLanguage = first.language ?? transportLanguage ?? undefined;
  let retried = false;
  let confidence = 0.85;

  if (useBisaya || isCebuanoLanguageHint(request.language_hint)) {
    let validation = validateBisayaTranscript({
      transcript,
      expectedLanguage: languagePlan.expectedLanguage,
      providerLanguage: detectedLanguage,
      confidence,
    });

    if (!validation.ok) {
      const retry = await callOpenAiTranscription({
        apiKey,
        model,
        audioBuffer: request.audioBuffer,
        mimeType: request.mimeType,
        transportLanguage,
        prompt: buildBisayaSttPrompt({
          extraHints: request.stt_hints,
          strongRetry: true,
        }),
        timeoutMs,
      });
      retried = true;

      if (retry.ok) {
        transcript = retry.transcript;
        detectedLanguage = retry.language ?? transportLanguage ?? detectedLanguage;
        validation = validateBisayaTranscript({
          transcript,
          expectedLanguage: languagePlan.expectedLanguage,
          providerLanguage: detectedLanguage,
          confidence,
        });
      }
    }

    // Never report Japanese/Arabic (or other out-of-set codes) as UI language.
    if (
      validation.rejectedScript ||
      (detectedLanguage &&
        !isProviderLanguageAllowedForCebuano(detectedLanguage))
    ) {
      detectedLanguage = languagePlan.expectedLanguage;
    }

    confidence = validation.confidence;
    const needsConfirmation = validation.needsConfirmation || !validation.ok;

    return {
      transcript,
      detected_language: detectedLanguage,
      confidence_score: confidence,
      warnings: needsConfirmation
        ? ["bisaya_transcript_needs_confirmation"]
        : [],
      expected_language: languagePlan.expectedLanguage,
      transport_language: transportLanguage,
      needs_confirmation: needsConfirmation,
      validation_reason: validation.reason,
      retried,
    };
  }

  return {
    transcript,
    detected_language: detectedLanguage,
    confidence_score: confidence,
    warnings: [],
    expected_language: languagePlan.expectedLanguage,
    transport_language: transportLanguage,
    needs_confirmation: false,
    retried: false,
  };
}
