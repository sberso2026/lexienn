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
import {
  validateBisayaTranscript,
  isProviderLanguageAllowedForCebuano,
} from "@/lib/speech/bisayaTranscriptValidation";
import {
  correctBisayaTranscript,
} from "@/lib/speech/bisayaLexiconCorrection";
import { checkBisayaAudioQuality } from "@/lib/speech/bisayaAudioQuality";
import { isCebuanoLanguageHint } from "@/lib/speech/bisayaStt";
import { inferSpokenLanguageFromTranscript } from "@/lib/languages/localLanguageDetector";

export type CloudTranscribeRequest = {
  audioBuffer: Buffer;
  mimeType: string;
  language_hint: string;
  user_context: UserContext;
  input_target: SpeechInputTarget;
  /** Bounded STT hint terms (no audio). */
  stt_hints?: string[];
  duration_ms?: number;
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
  const plan = resolveConstrainedSttLanguage(languageHint);
  if (plan.omitLanguageParam || !plan.transportLanguage) return undefined;
  return plan.transportLanguage;
}

async function callOpenAiTranscription(options: {
  apiKey: string;
  model: string;
  audioBuffer: Buffer;
  mimeType: string;
  transportLanguage: string | null;
  omitLanguageParam: boolean;
  prompt: string;
  timeoutMs: number;
  temperature: number;
  /** Prefer verbose_json so Whisper returns a detected language code. */
  preferVerboseJson?: boolean;
}): Promise<{ transcript: string; language?: string; ok: boolean; warning?: string }> {
  const extension = options.mimeType.includes("mp4")
    ? "m4a"
    : options.mimeType.includes("ogg")
      ? "ogg"
      : "webm";

  const tryFormats: Array<"verbose_json" | "json"> = options.preferVerboseJson
    ? ["verbose_json", "json"]
    : ["json"];

  for (const responseFormat of tryFormats) {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(options.audioBuffer)], {
      type: options.mimeType,
    });
    formData.append("file", blob, `speech.${extension}`);
    formData.append("model", options.model);
    // Never send unsupported language=ceb (no ISO 639-1).
    if (!options.omitLanguageParam && options.transportLanguage) {
      formData.append("language", options.transportLanguage);
    }
    formData.append("prompt", options.prompt);
    formData.append("temperature", String(options.temperature));
    formData.append("response_format", responseFormat);

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
        // Some models reject verbose_json — fall through to json.
        if (responseFormat === "verbose_json") continue;
        return {
          transcript: "",
          ok: false,
          warning: "Cloud speech-to-text request failed.",
        };
      }

      const payload = (await response.json()) as { text?: string; language?: string };
      const transcript = payload.text?.trim() ?? "";
      if (!transcript) {
        if (responseFormat === "verbose_json") continue;
        return {
          transcript: "",
          ok: false,
          warning: "No speech was detected.",
        };
      }

      return {
        transcript,
        language: payload.language?.trim() || undefined,
        ok: true,
      };
    } catch {
      if (responseFormat === "verbose_json") continue;
      return {
        transcript: "",
        ok: false,
        warning: "Cloud speech-to-text timed out or failed.",
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    transcript: "",
    ok: false,
    warning: "Cloud speech-to-text request failed.",
  };
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
  const languagePlan = resolveConstrainedSttLanguage(request.language_hint);
  const transportLanguage = languagePlan.transportLanguage || null;
  const useBisaya = shouldUseBisayaSttPrompt(request.language_hint);
  const temperature = useBisaya ? 0 : 0;

  if (useBisaya) {
    const quality = checkBisayaAudioQuality({
      durationMs: request.duration_ms,
      byteLength: request.audioBuffer.byteLength,
    });
    if (!quality.ok) {
      return {
        transcript: "",
        confidence_score: 0,
        warnings: [quality.warning ?? "Recording quality was too low."],
        expected_language: languagePlan.expectedLanguage,
        transport_language: null,
        needs_confirmation: true,
        validation_reason: quality.reason,
        retried: false,
      };
    }
  }

  const prompt = useBisaya
    ? buildBisayaSttPrompt({ extraHints: request.stt_hints, strongRetry: false })
    : buildGenericSttPrompt(request.input_target, request.user_context);

  const first = await callOpenAiTranscription({
    apiKey,
    model,
    audioBuffer: request.audioBuffer,
    mimeType: request.mimeType,
    transportLanguage,
    omitLanguageParam: languagePlan.omitLanguageParam,
    prompt,
    timeoutMs,
    temperature,
    preferVerboseJson: languagePlan.omitLanguageParam || languagePlan.expectedLanguage === "auto",
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
  let detectedLanguage = first.language ?? undefined;
  let retried = false;
  let confidence = 0.85;

  if (!detectedLanguage && languagePlan.expectedLanguage === "auto") {
    const inferred = inferSpokenLanguageFromTranscript(transcript);
    if (inferred.code) {
      detectedLanguage = inferred.code;
      confidence = Math.max(confidence * 0.95, inferred.confidence);
    }
  } else if (!detectedLanguage && languagePlan.expectedLanguage !== "auto") {
    // Explicit From language: keep expected code as detection signal for UI consumers.
    detectedLanguage = languagePlan.expectedLanguage;
  }

  if (useBisaya || isCebuanoLanguageHint(request.language_hint)) {
    transcript = correctBisayaTranscript(transcript).transcript;

    let validation = validateBisayaTranscript({
      transcript,
      expectedLanguage: languagePlan.expectedLanguage,
      providerLanguage: detectedLanguage,
      confidence,
    });

    if (!validation.ok || validation.rejectedScript) {
      const retry = await callOpenAiTranscription({
        apiKey,
        model,
        audioBuffer: request.audioBuffer,
        mimeType: request.mimeType,
        transportLanguage,
        omitLanguageParam: languagePlan.omitLanguageParam,
        prompt: buildBisayaSttPrompt({
          extraHints: request.stt_hints,
          strongRetry: true,
        }),
        timeoutMs,
        temperature: 0,
      });
      retried = true;

      if (retry.ok) {
        transcript = correctBisayaTranscript(retry.transcript).transcript;
        detectedLanguage = retry.language ?? detectedLanguage;
        validation = validateBisayaTranscript({
          transcript,
          expectedLanguage: languagePlan.expectedLanguage,
          providerLanguage: detectedLanguage,
          confidence,
        });
      }
    }

    if (
      validation.rejectedScript ||
      (detectedLanguage &&
        !isProviderLanguageAllowedForCebuano(detectedLanguage))
    ) {
      detectedLanguage = languagePlan.expectedLanguage;
    } else {
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
      transport_language: null,
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
