export type OcrProvider = "openai";

export type OcrConfig = {
  provider: OcrProvider;
  enabled: boolean;
  providerConfigured: boolean;
  modelConfigured: boolean;
  isConfigured: boolean;
  model: string;
};

export type OcrStatus = {
  ocr_enabled: boolean;
  provider: string;
  provider_configured: boolean;
  model_configured: boolean;
  local_ocr_available: boolean;
};

function parseBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === "") return defaultValue;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function getOcrConfig(): OcrConfig {
  const enabled = parseBooleanEnv(process.env.OCR_ENABLED, true);
  const apiKey = process.env.AI_API_KEY?.trim() ?? process.env.OCR_API_KEY?.trim() ?? "";
  const model = process.env.OCR_MODEL?.trim() || process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  const providerConfigured = apiKey.length > 0;
  const modelConfigured = model.length > 0;

  return {
    provider: "openai",
    enabled,
    providerConfigured,
    modelConfigured,
    isConfigured: enabled && providerConfigured && modelConfigured,
    model,
  };
}

export function getOcrStatus(localOcrAvailable = false): OcrStatus {
  const config = getOcrConfig();
  return {
    ocr_enabled: config.enabled,
    provider: config.provider,
    provider_configured: config.providerConfigured,
    model_configured: config.modelConfigured,
    local_ocr_available: localOcrAvailable,
  };
}

export function getOcrTimeoutMs(): number {
  const raw = process.env.OCR_TIMEOUT_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) return 45_000;
  return Math.min(parsed, 120_000);
}
