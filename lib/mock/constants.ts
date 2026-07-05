/** Shared notice for bundled seed data — illustrative until validated. */
export const SEED_DATA_NOTICE =
  "Bundled seed data for development and testing. Translations and pronunciations are illustrative and have not been verified by native speakers unless validation_status indicates otherwise.";

export const SEED_DATA_VALIDATION = "ai_generated" as const;

/** @deprecated Use SEED_DATA_NOTICE */
export const MVP_MOCK_DATA_NOTICE = SEED_DATA_NOTICE;

/** @deprecated Use SEED_DATA_VALIDATION */
export const MVP_MOCK_VALIDATION = SEED_DATA_VALIDATION;

export function mockConfidence(score: number) {
  const level = score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";
  return {
    score,
    level: level as "high" | "medium" | "low",
    warning:
      score < 0.7
        ? "Dialect confidence is low. Native speaker validation recommended."
        : undefined,
  };
}
