import { WarningCallout } from "@/components/ui/WarningCallout";
import { DEV_LABELS } from "@/lib/ui/developerLabels";
import type { DictionaryResolutionSource, ValidationStatus } from "@/lib/schemas";

const LOW_CONFIDENCE_THRESHOLD = 0.6;

const TRUSTED_SOURCES: DictionaryResolutionSource[] = [
  "curated_dictionary",
  "domain_glossary",
  "seed_dictionary",
];

interface DataQualityWarningsProps {
  validationStatus: ValidationStatus;
  confidenceScore: number;
  confidenceWarning?: string;
  resolutionSource?: DictionaryResolutionSource;
  isDefinitionRequest?: boolean;
  unavailableMessage?: string;
  /** Legacy offline phrase pack mock indicator — not used for dictionary results. */
  isMockData?: boolean;
  mockDataNotice?: string;
}

export function DataQualityWarnings({
  validationStatus,
  confidenceScore,
  confidenceWarning,
  resolutionSource,
  isDefinitionRequest = false,
  unavailableMessage,
  isMockData,
  mockDataNotice,
}: DataQualityWarningsProps) {
  const isTrustedSource =
    resolutionSource !== undefined && TRUSTED_SOURCES.includes(resolutionSource);
  const isUnavailable = resolutionSource === "unavailable";
  const isAiSource = resolutionSource === "ai_generated";
  const isAiUnverified =
    validationStatus === "ai_generated_unverified" || validationStatus === "ai_generated";

  const showLowConfidence =
    confidenceScore < LOW_CONFIDENCE_THRESHOLD &&
    !confidenceWarning &&
    !isUnavailable &&
    !isAiSource;

  return (
    <div className="space-y-2">
      {isMockData && mockDataNotice && !resolutionSource && (
        <WarningCallout title={DEV_LABELS.sampleData}>{mockDataNotice}</WarningCallout>
      )}

      {isUnavailable && (
        <WarningCallout title="Unavailable">
          {unavailableMessage ??
            "Definition unavailable from reliable sources. Try a simpler word or phrase."}
        </WarningCallout>
      )}

      {isAiSource && (
        <WarningCallout title="AI-generated, unverified">
          AI-generated explanation. Native speaker validation recommended.
        </WarningCallout>
      )}

      {validationStatus === "uncertain" &&
        !isTrustedSource &&
        !isUnavailable &&
        !isAiSource && (
          <WarningCallout>
            Not verified — uncertain validation status. Native speaker validation
            recommended.
          </WarningCallout>
        )}

      {isAiUnverified && !isAiSource && (
        <WarningCallout>
          Not verified — AI-generated content. Not native-speaker or dictionary
          verified.
        </WarningCallout>
      )}

      {confidenceWarning && (
        <WarningCallout title="Confidence warning">{confidenceWarning}</WarningCallout>
      )}

      {showLowConfidence && (
        <WarningCallout title="Low confidence">
          {isDefinitionRequest
            ? `Confidence score is below ${Math.round(LOW_CONFIDENCE_THRESHOLD * 100)}%. Review this definition carefully.`
            : `Confidence score is below ${Math.round(LOW_CONFIDENCE_THRESHOLD * 100)}%. Treat this translation as illustrative only.`}
        </WarningCallout>
      )}
    </div>
  );
}
