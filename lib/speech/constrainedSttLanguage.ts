import {
  CEBUANO_BASE,
  isCebuanoLanguageHint,
} from "@/lib/speech/bisayaStt";

/**
 * Resolve provider transport language vs expected language.
 * expectedLanguage is always preserved for validation / UI.
 * Transport may use a closest supported locale when the provider
 * cannot accept `ceb` on the wire.
 */
export type ConstrainedSttLanguagePlan = {
  expectedLanguage: string;
  /** ISO-ish code sent as OpenAI `language` (never omitted for constrained ceb). */
  transportLanguage: string;
  constrained: boolean;
  reason: string;
};

/** Models known to accept broader / non-ISO639-1 language codes. */
function modelAcceptsCebuanoCode(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return (
    normalized.includes("gpt-4o-transcribe") ||
    normalized.includes("4o-transcribe") ||
    normalized.includes("gpt-4o-mini-transcribe")
  );
}

export function resolveConstrainedSttLanguage(
  languageHint: string,
  model: string,
): ConstrainedSttLanguagePlan {
  if (!isCebuanoLanguageHint(languageHint)) {
    const base =
      languageHint.trim().toLowerCase().split("::")[0]?.split("-")[0] || "en";
    if (!base || base === "auto") {
      return {
        expectedLanguage: "auto",
        transportLanguage: "",
        constrained: false,
        reason: "open_auto",
      };
    }
    return {
      expectedLanguage: base,
      transportLanguage: base === "fil" ? "tl" : base,
      constrained: false,
      reason: "unconstrained",
    };
  }

  if (modelAcceptsCebuanoCode(model)) {
    return {
      expectedLanguage: CEBUANO_BASE,
      transportLanguage: CEBUANO_BASE,
      constrained: true,
      reason: "fixed_ceb_supported",
    };
  }

  // whisper-1 and similar: closest Philippine transport locale, expected stays ceb.
  return {
    expectedLanguage: CEBUANO_BASE,
    transportLanguage: "tl",
    constrained: true,
    reason: "fixed_ceb_closest_transport",
  };
}

/** Prefer gpt-4o-transcribe for constrained Cebuano when env still points at whisper-1. */
export function resolveConstrainedSttModel(
  languageHint: string,
  configuredModel: string,
): string {
  if (!isCebuanoLanguageHint(languageHint)) return configuredModel;
  const configured = configuredModel.trim() || "whisper-1";
  if (
    configured.includes("transcribe") &&
    !configured.startsWith("whisper")
  ) {
    return configured;
  }
  const override = process.env.SPEECH_INPUT_MODEL_CONSTRAINED?.trim();
  if (override) return override;
  return "gpt-4o-transcribe";
}
