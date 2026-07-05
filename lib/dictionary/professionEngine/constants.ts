export const ENGINEERING_CAUTION =
  "This is a language explanation, not professional design advice.";

export const MEDICAL_CAUTION =
  "This is a language explanation, not medical advice.";

export const SAFETY_CAUTION =
  "This is a language explanation, not professional safety guidance.";

import { normalizeLookupCandidates } from "@/lib/text/normalizeLookupText";

export function normalizeInputKey(input: string): string {
  const [primary] = normalizeLookupCandidates(input);
  return primary ?? input.trim().toLowerCase();
}

export function resolveContext(context: string): string {
  return context === "custom" ? "general" : context;
}

export function cautionForContext(
  context: string,
  options?: { engineering?: boolean; medical?: boolean; safety?: boolean },
): string | undefined {
  if (options?.medical || context === "health_emergency") {
    return MEDICAL_CAUTION;
  }
  if (
    options?.safety ||
    (options?.engineering &&
      (context === "engineer" || context === "construction_worker"))
  ) {
    return context === "engineer" || context === "construction_worker"
      ? ENGINEERING_CAUTION
      : SAFETY_CAUTION;
  }
  if (context === "engineer" || context === "construction_worker") {
    return ENGINEERING_CAUTION;
  }
  if (context === "health_emergency") {
    return MEDICAL_CAUTION;
  }
  return undefined;
}
