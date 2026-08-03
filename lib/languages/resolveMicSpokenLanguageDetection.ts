import { detectLanguageLocal } from "@/lib/languages/localLanguageDetector";
import {
  buildSpokenLanguageDetectionResult,
  decideSpokenLanguageDetection,
  mapProviderLanguageToCatalog,
  SPOKEN_LANG_HIGH_CONFIDENCE,
  type SpokenLanguageDetectionResult,
  type SpokenLanguageDetectionSource,
} from "@/lib/languages/spokenLanguageDetection";
import { recordLanguageDetectionDiagnostic } from "@/lib/languages/languageDetectionDiagnostics";
import type { LanguageDetectionPipelineResult } from "@/lib/languages/languageDetectionTypes";

export type MicLanguageResolution = {
  detection: SpokenLanguageDetectionResult;
  /** True when Stage 1–2 are insufficient and AI should run. */
  needsAi: boolean;
  /** True when From can be applied immediately. */
  canApply: boolean;
  /** True when the UI should ask the user to confirm. */
  needsConfirm: boolean;
};

function toDiagnostic(
  detection: SpokenLanguageDetectionResult,
  extras: { aiCalled?: boolean; fromCache?: boolean; localReason?: string } = {},
): void {
  const snapshot: LanguageDetectionPipelineResult = {
    transcript: detection.transcript,
    primaryCode: detection.detectedLanguageCode,
    primaryName: detection.detectedLanguageName,
    secondaryCode: detection.secondaryLanguageCode ?? null,
    secondaryName: detection.secondaryLanguageName ?? null,
    confidence: detection.confidence ?? 0,
    stage: detection.detectionStage ?? "local",
    durationMs: detection.detectionTimeMs ?? detection.durationMs,
    fromCache: Boolean(extras.fromCache),
    needsUserConfirmation: Boolean(
      detection.confidence != null &&
        detection.confidence >= 0.45 &&
        detection.confidence < SPOKEN_LANG_HIGH_CONFIDENCE,
    ),
    message: detection.detectedLanguageName
      ? `Detected: ${detection.detectedLanguageName}`
      : "Language could not be detected reliably. Select it manually.",
    aiCalled: Boolean(extras.aiCalled),
    localReason: extras.localReason,
  };
  recordLanguageDetectionDiagnostic(snapshot);
}

/**
 * Mic Auto Detect order (Batch 52A hotfix):
 * 1) STT provider language → canonical catalog mapping
 * 2) Local transcript detector (when provider missing/weak)
 * 3) Caller may then run AI
 * 4) User confirmation when still uncertain
 *
 * Applies immediately when confidence is reliable — does not wait for AI.
 */
export function resolveMicSpokenLanguageDetection(input: {
  transcript: string;
  providerLanguage?: string | null;
  providerConfidence?: number | null;
  source?: SpokenLanguageDetectionSource;
  durationMs?: number;
}): MicLanguageResolution {
  const startedAt = Date.now();
  const transcript = input.transcript.trim();
  const source = input.source ?? "server_stt";
  const durationMs = input.durationMs ?? 0;

  if (!transcript) {
    const detection = buildSpokenLanguageDetectionResult({
      transcript: "",
      providerLanguage: null,
      confidence: 0,
      source,
      durationMs,
      detectionStage: "local",
      detectionTimeMs: 0,
    });
    return {
      detection,
      needsAi: false,
      canApply: false,
      needsConfirm: false,
    };
  }

  const providerCatalog = mapProviderLanguageToCatalog(input.providerLanguage);
  const providerConfidence =
    typeof input.providerConfidence === "number" &&
    Number.isFinite(input.providerConfidence)
      ? input.providerConfidence
      : null;

  // Always run local — used for fallback, secondary language, and strong overrides.
  const local = detectLanguageLocal(transcript);
  const localCatalog = mapProviderLanguageToCatalog(local.primaryCode);
  const localSecondary = mapProviderLanguageToCatalog(local.secondaryCode);

  // 1) STT provider language with reliable confidence → apply immediately.
  if (
    providerCatalog &&
    (providerConfidence == null || providerConfidence >= SPOKEN_LANG_HIGH_CONFIDENCE)
  ) {
    // Strong local phrase/script hit can override a weak/mismatched provider code.
    const preferLocal =
      localCatalog &&
      local.confidence >= 0.95 &&
      localCatalog.value !== providerCatalog.value;

    const code = preferLocal ? localCatalog!.value : providerCatalog.value;
    const name = preferLocal
      ? localCatalog!.display_name
      : providerCatalog.display_name;
    const confidence = preferLocal
      ? local.confidence
      : Math.max(providerConfidence ?? 0.9, 0.9);
    const secondaryCode =
      localSecondary && localSecondary.value !== code
        ? localSecondary.value
        : null;

    const detection: SpokenLanguageDetectionResult = {
      transcript,
      detectedLanguageCode: code,
      detectedLanguageName: name,
      secondaryLanguageCode: secondaryCode,
      secondaryLanguageName: secondaryCode ? localSecondary?.display_name ?? null : null,
      confidence,
      source,
      durationMs,
      detectionStage: preferLocal ? "local" : "local",
      detectionTimeMs: Date.now() - startedAt,
    };
    toDiagnostic(detection, {
      localReason: preferLocal ? `${local.reason}+override_provider` : "stt_provider",
    });
    const decision = decideSpokenLanguageDetection(detection);
    return {
      detection,
      needsAi: false,
      canApply: decision.action === "apply",
      needsConfirm: decision.action === "confirm",
    };
  }

  // Provider present but only medium confidence — still prefer it if local agrees or is weak.
  if (providerCatalog && providerConfidence != null && providerConfidence >= 0.45) {
    const agrees =
      !localCatalog ||
      localCatalog.value === providerCatalog.value ||
      local.confidence < 0.75;
    if (agrees) {
      const detection: SpokenLanguageDetectionResult = {
        transcript,
        detectedLanguageCode: providerCatalog.value,
        detectedLanguageName: providerCatalog.display_name,
        secondaryLanguageCode:
          localSecondary && localSecondary.value !== providerCatalog.value
            ? localSecondary.value
            : null,
        secondaryLanguageName:
          localSecondary && localSecondary.value !== providerCatalog.value
            ? localSecondary.display_name
            : null,
        confidence: Math.max(providerConfidence, local.confidence * 0.5),
        source,
        durationMs,
        detectionStage: "local",
        detectionTimeMs: Date.now() - startedAt,
      };
      toDiagnostic(detection, { localReason: "stt_provider_medium" });
      const decision = decideSpokenLanguageDetection(detection);
      return {
        detection,
        needsAi: decision.action !== "apply" && local.confidence < 0.95,
        canApply: decision.action === "apply",
        needsConfirm: decision.action === "confirm",
      };
    }
  }

  // 2) Provider missing/unreliable → local transcript detector before failing.
  if (localCatalog && local.confidence >= SPOKEN_LANG_HIGH_CONFIDENCE) {
    const detection: SpokenLanguageDetectionResult = {
      transcript,
      detectedLanguageCode: localCatalog.value,
      detectedLanguageName: localCatalog.display_name,
      secondaryLanguageCode: localSecondary?.value ?? null,
      secondaryLanguageName: localSecondary?.display_name ?? null,
      confidence: local.confidence,
      source,
      durationMs,
      detectionStage: "local",
      detectionTimeMs: Date.now() - startedAt,
    };
    toDiagnostic(detection, { localReason: local.reason });
    return {
      detection,
      needsAi: false,
      canApply: true,
      needsConfirm: false,
    };
  }

  if (localCatalog && local.confidence >= 0.45) {
    const detection: SpokenLanguageDetectionResult = {
      transcript,
      detectedLanguageCode: localCatalog.value,
      detectedLanguageName: localCatalog.display_name,
      secondaryLanguageCode: localSecondary?.value ?? null,
      secondaryLanguageName: localSecondary?.display_name ?? null,
      confidence: local.confidence,
      source,
      durationMs,
      detectionStage: "local",
      detectionTimeMs: Date.now() - startedAt,
    };
    toDiagnostic(detection, { localReason: local.reason });
    const decision = decideSpokenLanguageDetection(detection);
    return {
      detection,
      needsAi: true,
      canApply: decision.action === "apply",
      needsConfirm: decision.action === "confirm",
    };
  }

  // 3) Need AI — emit empty/low detection so caller can upgrade after AI.
  const detection = buildSpokenLanguageDetectionResult({
    transcript,
    providerLanguage: input.providerLanguage,
    confidence: providerConfidence,
    source,
    durationMs,
    detectionStage: "local",
    detectionTimeMs: Date.now() - startedAt,
  });
  toDiagnostic(detection, { localReason: local.reason || "needs_ai" });
  return {
    detection,
    needsAi: true,
    canApply: false,
    needsConfirm: false,
  };
}
