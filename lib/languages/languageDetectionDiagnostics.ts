import type {
  DetectionStage,
  LanguageDetectionPipelineResult,
} from "@/lib/languages/languageDetectionTypes";

export type LanguageDetectionDiagnosticSnapshot = {
  detectedLanguage: string | null;
  secondaryLanguage: string | null;
  confidence: number;
  stage: DetectionStage;
  detectionTimeMs: number;
  aiCalled: boolean;
  fromCache: boolean;
  localReason?: string;
  transcriptPreview: string;
  updatedAt: number;
};

let lastDiagnostic: LanguageDetectionDiagnosticSnapshot | null = null;
const listeners = new Set<() => void>();

export function recordLanguageDetectionDiagnostic(
  result: LanguageDetectionPipelineResult,
): void {
  lastDiagnostic = {
    detectedLanguage: result.primaryName ?? result.primaryCode,
    secondaryLanguage: result.secondaryName ?? result.secondaryCode,
    confidence: result.confidence,
    stage: result.stage,
    detectionTimeMs: result.durationMs,
    aiCalled: result.aiCalled,
    fromCache: result.fromCache,
    localReason: result.localReason,
    transcriptPreview: result.transcript.slice(0, 80),
    updatedAt: Date.now(),
  };
  for (const listener of listeners) listener();
}

export function getLanguageDetectionDiagnostic(): LanguageDetectionDiagnosticSnapshot | null {
  return lastDiagnostic;
}

export function subscribeLanguageDetectionDiagnostic(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearLanguageDetectionDiagnostic(): void {
  lastDiagnostic = null;
  for (const listener of listeners) listener();
}

export function formatDetectionStageLabel(stage: DetectionStage): string {
  switch (stage) {
    case "local":
      return "Local";
    case "ai":
      return "AI";
    case "user":
      return "User";
    case "cache":
      return "Cache";
    default:
      return stage;
  }
}
