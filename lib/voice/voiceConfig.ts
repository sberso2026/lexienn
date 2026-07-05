import type { VoiceStatusResponse } from "@/lib/voice/voiceSchemas";

export type VoiceProvider = "openai";

export type VoiceConfig = {
  provider: VoiceProvider;
  apiKey: string;
  model: string;
  voiceName: string;
  enabled: boolean;
  fallbackEnabled: boolean;
  providerConfigured: boolean;
  modelConfigured: boolean;
  isConfigured: boolean;
};

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function getVoiceConfig(): VoiceConfig {
  const enabled = parseBooleanEnv(process.env.VOICE_ENABLED, true);
  const fallbackEnabled = parseBooleanEnv(process.env.VOICE_FALLBACK_ENABLED, true);
  const providerRaw = process.env.VOICE_PROVIDER?.trim() || "openai";
  const provider: VoiceProvider = providerRaw === "openai" ? "openai" : "openai";
  const apiKey = process.env.AI_API_KEY?.trim() ?? "";
  const model = process.env.VOICE_MODEL?.trim() ?? "";
  const voiceName = process.env.VOICE_NAME?.trim() || "alloy";

  const providerConfigured = provider === "openai" && apiKey.length > 0;
  const modelConfigured = model.length > 0;
  const isConfigured =
    enabled && providerConfigured && modelConfigured && provider === "openai";

  return {
    provider,
    apiKey,
    model,
    voiceName,
    enabled,
    fallbackEnabled,
    providerConfigured,
    modelConfigured,
    isConfigured,
  };
}

export function getVoiceStatus(): VoiceStatusResponse {
  const config = getVoiceConfig();
  return {
    voice_enabled: config.enabled,
    provider: config.provider,
    provider_configured: config.providerConfigured,
    model_configured: config.modelConfigured,
    fallback_enabled: config.fallbackEnabled,
  };
}

export function getVoiceTimeoutMs(): number {
  const raw = process.env.VOICE_TIMEOUT_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 20_000;
  return Math.min(parsed, 120_000);
}
