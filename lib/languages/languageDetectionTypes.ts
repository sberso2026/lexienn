export type DetectionStage = "local" | "ai" | "user" | "cache";

export type LanguageDetectionPipelineResult = {
  transcript: string;
  primaryCode: string | null;
  primaryName: string | null;
  secondaryCode: string | null;
  secondaryName: string | null;
  confidence: number;
  stage: DetectionStage;
  durationMs: number;
  fromCache: boolean;
  needsUserConfirmation: boolean;
  message: string;
  localReason?: string;
  aiCalled: boolean;
};
