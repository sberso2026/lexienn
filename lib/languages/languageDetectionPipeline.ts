import {
  getCachedLanguageDetection,
  setCachedLanguageDetection,
} from "@/lib/languages/languageDetectionCache";
import { identifyLanguageWithAi } from "@/lib/languages/aiLanguageIdentification";
import {
  detectLanguageLocal,
  LOCAL_SKIP_AI_CONFIDENCE,
} from "@/lib/languages/localLanguageDetector";
import { OBVIOUS_LOCAL_LANGUAGES } from "@/lib/languages/languageDetectionPhrases";
import {
  mapProviderLanguageToCatalog,
  type SpokenLanguageDetectionResult,
  type SpokenLanguageDetectionSource,
} from "@/lib/languages/spokenLanguageDetection";
import { recordLanguageDetectionDiagnostic } from "@/lib/languages/languageDetectionDiagnostics";
import type {
  DetectionStage,
  LanguageDetectionPipelineResult,
} from "@/lib/languages/languageDetectionTypes";

export type { DetectionStage, LanguageDetectionPipelineResult };

export type DetectLanguageOptions = {
  allowAi?: boolean;
  providerLanguage?: string | null;
  providerConfidence?: number | null;
  localOnly?: boolean;
  aiIdentifier?: (transcript: string) => Promise<{
    primaryCode: string | null;
    secondaryCode: string | null;
    confidence: number;
  }>;
};

function catalogName(code: string | null): string | null {
  if (!code) return null;
  return mapProviderLanguageToCatalog(code)?.display_name ?? null;
}

function catalogValue(code: string | null): string | null {
  if (!code) return null;
  return mapProviderLanguageToCatalog(code)?.value ?? null;
}

function unreliableResult(
  transcript: string,
  startedAt: number,
  extras: Partial<LanguageDetectionPipelineResult> = {},
): LanguageDetectionPipelineResult {
  const result: LanguageDetectionPipelineResult = {
    transcript,
    primaryCode: null,
    primaryName: null,
    secondaryCode: null,
    secondaryName: null,
    confidence: 0,
    stage: extras.stage ?? "local",
    durationMs: Date.now() - startedAt,
    fromCache: false,
    needsUserConfirmation: false,
    message: "Language could not be detected reliably. Select it manually.",
    aiCalled: extras.aiCalled ?? false,
    localReason: extras.localReason,
  };
  recordLanguageDetectionDiagnostic(result);
  return result;
}

function buildResult(input: {
  transcript: string;
  primaryCode: string | null;
  secondaryCode: string | null;
  confidence: number;
  stage: DetectionStage;
  startedAt: number;
  fromCache?: boolean;
  aiCalled: boolean;
  localReason?: string;
}): LanguageDetectionPipelineResult {
  const primaryCode = catalogValue(input.primaryCode);
  const secondaryCode = catalogValue(input.secondaryCode);
  const primaryName = catalogName(primaryCode);
  const secondaryName = catalogName(secondaryCode);
  const confidence = input.confidence;

  if (!primaryCode || confidence < 0.45) {
    return unreliableResult(input.transcript, input.startedAt, {
      stage: input.stage,
      aiCalled: input.aiCalled,
      localReason: input.localReason,
    });
  }

  const needsUserConfirmation = confidence < 0.75;
  const stage: DetectionStage = needsUserConfirmation ? "user" : input.stage;

  let message: string;
  if (needsUserConfirmation) {
    message = `We detected ${primaryName}. Use this language?`;
  } else if (secondaryName) {
    message = `Detected: ${primaryName} (also ${secondaryName})`;
  } else {
    message = `Detected: ${primaryName}`;
  }

  const result: LanguageDetectionPipelineResult = {
    transcript: input.transcript,
    primaryCode,
    primaryName,
    secondaryCode,
    secondaryName,
    confidence,
    stage,
    durationMs: Date.now() - input.startedAt,
    fromCache: Boolean(input.fromCache),
    needsUserConfirmation,
    message,
    localReason: input.localReason,
    aiCalled: input.aiCalled,
  };
  recordLanguageDetectionDiagnostic(result);
  return result;
}

/**
 * Enterprise 3-stage language detection:
 * 1) Fast local profiles / phrases / scripts
 * 2) AI only when local confidence < 95% (never for obvious local hits)
 * 3) Ask the user when still uncertain
 */
export async function detectLanguagePipeline(
  transcript: string,
  options: DetectLanguageOptions = {},
): Promise<LanguageDetectionPipelineResult> {
  const startedAt = Date.now();
  const text = transcript.trim();
  if (!text) {
    return unreliableResult(text, startedAt);
  }

  const cached = getCachedLanguageDetection(text);
  if (cached?.primaryCode && cached.confidence >= 0.45) {
    const hit: LanguageDetectionPipelineResult = {
      ...cached,
      transcript: text,
      stage: "cache",
      fromCache: true,
      durationMs: Date.now() - startedAt,
      aiCalled: false,
      needsUserConfirmation: cached.confidence < 0.75,
    };
    if (!hit.needsUserConfirmation) {
      hit.message = hit.secondaryName
        ? `Detected: ${hit.primaryName} (also ${hit.secondaryName})`
        : `Detected: ${hit.primaryName}`;
    }
    recordLanguageDetectionDiagnostic(hit);
    return hit;
  }

  const local = detectLanguageLocal(text);
  const localPrimary = catalogValue(local.primaryCode);
  const localSecondary = catalogValue(local.secondaryCode);
  const providerCode =
    mapProviderLanguageToCatalog(options.providerLanguage)?.value ?? null;
  const providerConfidence =
    typeof options.providerConfidence === "number" &&
    Number.isFinite(options.providerConfidence)
      ? options.providerConfidence
      : null;

  const allowAi = options.allowAi !== false && !options.localOnly;

  // Mic/STT-first: reliable provider language applies before local/AI.
  // Typed detection typically omits providerLanguage, so behavior is unchanged.
  if (
    providerCode &&
    (providerConfidence == null || providerConfidence >= 0.75)
  ) {
    const preferLocal =
      localPrimary != null &&
      local.confidence >= LOCAL_SKIP_AI_CONFIDENCE &&
      localPrimary !== providerCode;
    const result = buildResult({
      transcript: text,
      primaryCode: preferLocal ? localPrimary : providerCode,
      secondaryCode: localSecondary,
      confidence: preferLocal
        ? local.confidence
        : Math.max(providerConfidence ?? 0.9, 0.9),
      stage: "local",
      startedAt,
      aiCalled: false,
      localReason: preferLocal ? `${local.reason}+override_provider` : "stt_provider",
    });
    if (result.primaryCode) setCachedLanguageDetection(text, result);
    return result;
  }

  const obviousLocal =
    local.primaryCode != null &&
    local.confidence >= LOCAL_SKIP_AI_CONFIDENCE &&
    OBVIOUS_LOCAL_LANGUAGES.has(local.primaryCode);

  if (obviousLocal || local.confidence >= LOCAL_SKIP_AI_CONFIDENCE) {
    const result = buildResult({
      transcript: text,
      primaryCode: localPrimary,
      secondaryCode: localSecondary,
      confidence: local.confidence,
      stage: "local",
      startedAt,
      aiCalled: false,
      localReason: local.reason,
    });
    if (result.primaryCode) setCachedLanguageDetection(text, result);
    return result;
  }

  if (
    providerCode &&
    localPrimary === providerCode &&
    local.confidence >= 0.55
  ) {
    const result = buildResult({
      transcript: text,
      primaryCode: providerCode,
      secondaryCode: localSecondary,
      confidence: Math.max(0.9, local.confidence, options.providerConfidence ?? 0),
      stage: "local",
      startedAt,
      aiCalled: false,
      localReason: `${local.reason}+provider`,
    });
    if (result.primaryCode) setCachedLanguageDetection(text, result);
    return result;
  }

  let primaryCode = localPrimary ?? providerCode;
  let secondaryCode = localSecondary;
  let confidence = localPrimary
    ? local.confidence
    : providerCode
      ? Math.max(options.providerConfidence ?? 0.7, 0.7)
      : 0;
  let stage: DetectionStage = "local";
  let aiCalled = false;

  const shouldCallAi =
    allowAi &&
    confidence < LOCAL_SKIP_AI_CONFIDENCE &&
    !(
      local.primaryCode &&
      OBVIOUS_LOCAL_LANGUAGES.has(local.primaryCode) &&
      local.confidence >= 0.9
    );

  if (shouldCallAi) {
    aiCalled = true;
    const ai = options.aiIdentifier
      ? await options.aiIdentifier(text)
      : await identifyLanguageWithAi(text);
    if (ai.primaryCode) {
      primaryCode =
        mapProviderLanguageToCatalog(ai.primaryCode)?.value ?? primaryCode;
      secondaryCode =
        mapProviderLanguageToCatalog(ai.secondaryCode)?.value ?? secondaryCode;
      confidence = Math.max(confidence, ai.confidence);
      stage = "ai";
    } else {
      stage = "ai";
    }
  }

  const result = buildResult({
    transcript: text,
    primaryCode,
    secondaryCode,
    confidence,
    stage,
    startedAt,
    aiCalled,
    localReason: local.reason,
  });
  if (result.primaryCode) setCachedLanguageDetection(text, result);
  return result;
}

export function pipelineResultToSpokenDetection(
  result: LanguageDetectionPipelineResult,
  source: SpokenLanguageDetectionSource = "server_stt",
): SpokenLanguageDetectionResult {
  return {
    transcript: result.transcript,
    detectedLanguageCode: result.primaryCode,
    detectedLanguageName: result.primaryName,
    secondaryLanguageCode: result.secondaryCode,
    secondaryLanguageName: result.secondaryName,
    confidence: result.confidence,
    source,
    durationMs: result.durationMs,
    detectionStage: result.stage,
    detectionTimeMs: result.durationMs,
  };
}
