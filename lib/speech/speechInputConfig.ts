export type SpeechInputProvider = "openai";

export type SpeechInputConfig = {
  provider: SpeechInputProvider;
  enabled: boolean;
  fallbackEnabled: boolean;
  providerConfigured: boolean;
  modelConfigured: boolean;
  isConfigured: boolean;
  model: string;
};

export type SpeechInputStatus = {
  speech_input_enabled: boolean;
  provider: string;
  provider_configured: boolean;
  model_configured: boolean;
  fallback_enabled: boolean;
  browser_speech_available: boolean;
};

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function getSpeechInputConfig(): SpeechInputConfig {
  const enabled = parseBooleanEnv(process.env.SPEECH_INPUT_ENABLED, true);
  const fallbackEnabled = parseBooleanEnv(process.env.SPEECH_INPUT_FALLBACK_ENABLED, true);
  const apiKey = process.env.AI_API_KEY?.trim() ?? "";
  const model = process.env.SPEECH_INPUT_MODEL?.trim() || "whisper-1";
  const providerConfigured = apiKey.length > 0;
  const modelConfigured = model.length > 0;

  return {
    provider: "openai",
    enabled,
    fallbackEnabled,
    providerConfigured,
    modelConfigured,
    isConfigured: enabled && providerConfigured && modelConfigured,
    model,
  };
}

export function getSpeechInputTimeoutMs(): number {
  const raw = process.env.SPEECH_INPUT_TIMEOUT_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 20_000;
  return Math.min(parsed, 120_000);
}

export function getSpeechInputStatus(browserSpeechAvailable = false): SpeechInputStatus {
  const config = getSpeechInputConfig();
  return {
    speech_input_enabled: config.enabled,
    provider: config.provider,
    provider_configured: config.providerConfigured,
    model_configured: config.modelConfigured,
    fallback_enabled: config.fallbackEnabled,
    browser_speech_available: browserSpeechAvailable,
  };
}
