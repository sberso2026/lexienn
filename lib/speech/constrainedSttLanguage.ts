import {
  CEBUANO_BASE,
  isCebuanoLanguageHint,
} from "@/lib/speech/bisayaStt";

/**
 * Resolve provider transport language vs expected language.
 * Cebuano has no ISO 639-1 code — never send `language=ceb`.
 * Prompt + post-validation constrain the transcript instead.
 */
export type ConstrainedSttLanguagePlan = {
  expectedLanguage: string;
  /**
   * ISO 639-1 code for OpenAI `language`, or empty to omit.
   * Empty for Cebuano (unsupported on the wire).
   */
  transportLanguage: string;
  constrained: boolean;
  omitLanguageParam: boolean;
  reason: string;
};

export function resolveConstrainedSttLanguage(
  languageHint: string,
): ConstrainedSttLanguagePlan {
  if (!isCebuanoLanguageHint(languageHint)) {
    const base =
      languageHint.trim().toLowerCase().split("::")[0]?.split("-")[0] || "en";
    if (!base || base === "auto") {
      return {
        expectedLanguage: "auto",
        transportLanguage: "",
        constrained: false,
        omitLanguageParam: true,
        reason: "open_auto",
      };
    }
    return {
      expectedLanguage: base,
      transportLanguage: base === "fil" ? "tl" : base,
      constrained: false,
      omitLanguageParam: false,
      reason: "unconstrained",
    };
  }

  // Never send language=ceb — OpenAI expects ISO 639-1; Cebuano has none.
  return {
    expectedLanguage: CEBUANO_BASE,
    transportLanguage: "",
    constrained: true,
    omitLanguageParam: true,
    reason: "cebuano_omit_unsupported_iso6391",
  };
}

/** Always prefer gpt-4o-transcribe for constrained Cebuano. */
export function resolveConstrainedSttModel(
  languageHint: string,
  configuredModel: string,
): string {
  if (!isCebuanoLanguageHint(languageHint)) return configuredModel;
  const override = process.env.SPEECH_INPUT_MODEL_CONSTRAINED?.trim();
  if (override) return override;
  const configured = configuredModel.trim() || "whisper-1";
  if (
    configured.includes("gpt-4o-transcribe") ||
    configured.includes("4o-mini-transcribe")
  ) {
    return configured;
  }
  return "gpt-4o-transcribe";
}
