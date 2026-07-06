export type AiProvider = "openai";

export type AiConfig = {
  provider: AiProvider;
  apiKey: string;
  model: string;
  enabled: boolean;
  fallbackEnabled: boolean;
  providerConfigured: boolean;
  modelConfigured: boolean;
  isConfigured: boolean;
};

export type AiStatus = {
  ai_enabled: boolean;
  provider: string;
  provider_configured: boolean;
  model_configured: boolean;
  fallback_enabled: boolean;
};

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function getAiConfig(): AiConfig {
  const enabled = parseBooleanEnv(process.env.AI_ENABLED, true);
  const fallbackEnabled = parseBooleanEnv(process.env.AI_FALLBACK_ENABLED, true);
  const providerRaw = process.env.AI_PROVIDER?.trim() || "openai";
  const provider: AiProvider = providerRaw === "openai" ? "openai" : "openai";
  const apiKey = process.env.AI_API_KEY?.trim() ?? "";
  const model = process.env.AI_MODEL?.trim() ?? "";

  const providerConfigured = provider === "openai" && apiKey.length > 0;
  const modelConfigured = model.length > 0;
  const isConfigured =
    enabled && providerConfigured && modelConfigured && provider === "openai";

  return {
    provider,
    apiKey,
    model,
    enabled,
    fallbackEnabled,
    providerConfigured,
    modelConfigured,
    isConfigured,
  };
}

export function getAiStatus(): AiStatus {
  const config = getAiConfig();
  return {
    ai_enabled: config.enabled,
    provider: config.provider,
    provider_configured: config.providerConfigured,
    model_configured: config.modelConfigured,
    fallback_enabled: config.fallbackEnabled,
  };
}

export function getAiTimeoutMs(): number {
  const raw = process.env.AI_TIMEOUT_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 30_000;
  return Math.min(parsed, 120_000);
}

import { normalizeOpenAiApiBaseUrl } from "@/lib/ai/openAiEndpoint";

export function getAiBaseUrl(): string {
  return normalizeOpenAiApiBaseUrl(process.env.AI_BASE_URL).baseUrl;
}

export type AiPublicStatus = {
  aiEnabled: boolean;
  providerConfigured: boolean;
  modelConfigured: boolean;
  hasApiKey: boolean;
  timeoutMs: number;
  runtime: "server";
  developerMode: boolean;
  provider: string;
  fallbackEnabled: boolean;
};

export function getAiPublicStatus(): AiPublicStatus {
  const config = getAiConfig();
  return {
    aiEnabled: config.enabled,
    providerConfigured: config.providerConfigured,
    modelConfigured: config.modelConfigured,
    hasApiKey: config.apiKey.length > 0,
    timeoutMs: getAiTimeoutMs(),
    runtime: "server",
    developerMode: process.env.NEXT_PUBLIC_ENABLE_DEVELOPER_MODE === "true",
    provider: config.provider,
    fallbackEnabled: config.fallbackEnabled,
  };
}

export function getOfflinePackAiTimeoutMs(): number {
  const raw = process.env.OFFLINE_PACK_AI_TIMEOUT_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) return Math.min(parsed, 120_000);
  return Math.max(getAiTimeoutMs(), 45_000);
}

export function getAiConfigDiagnostic(): string | null {
  if (process.env.NODE_ENV === "production") return null;

  const config = getAiConfig();
  const issues: string[] = [];

  if (!config.enabled) issues.push("AI_ENABLED is false");
  if (!config.providerConfigured) issues.push("AI_API_KEY or AI_PROVIDER missing/invalid");
  if (!config.modelConfigured) issues.push("AI_MODEL missing");

  if (issues.length === 0) return null;
  return `AI dictionary generation skipped: ${issues.join("; ")}`;
}
