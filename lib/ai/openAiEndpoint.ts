export const DEFAULT_OPENAI_API_BASE = "https://api.openai.com/v1";

export const OPENAI_CHAT_COMPLETIONS_RELATIVE_PATH = "/chat/completions";

/** Endpoint path suffixes that must not appear in AI_BASE_URL. */
const ENDPOINT_PATH_SUFFIXES = [
  "/v1/chat/completions",
  "/chat/completions",
  "/responses",
  "/embeddings",
  "/completions",
] as const;

export type NormalizedOpenAiBaseUrl = {
  baseUrl: string;
  configWarning: string | null;
};

/**
 * Normalize AI_BASE_URL to an API root ending before /chat/completions.
 * Default: https://api.openai.com/v1
 */
export function normalizeOpenAiApiBaseUrl(custom?: string): NormalizedOpenAiBaseUrl {
  let raw = (custom?.trim() || DEFAULT_OPENAI_API_BASE).replace(/\/+$/, "");
  let configWarning: string | null = null;

  const lower = raw.toLowerCase();
  for (const suffix of ENDPOINT_PATH_SUFFIXES) {
    if (lower.endsWith(suffix)) {
      raw = raw.slice(0, -suffix.length).replace(/\/+$/, "");
      configWarning = `AI_BASE_URL included endpoint path "${suffix}"; normalized to base "${raw}"`;
      break;
    }
  }

  if (raw === "https://api.openai.com") {
    raw = DEFAULT_OPENAI_API_BASE;
  }

  return { baseUrl: raw, configWarning };
}

export function getOpenAiChatCompletionsUrl(customBase?: string): string {
  const { baseUrl } = normalizeOpenAiApiBaseUrl(
    customBase ?? process.env.AI_BASE_URL,
  );
  return `${baseUrl}${OPENAI_CHAT_COMPLETIONS_RELATIVE_PATH}`;
}

export function getOpenAiEndpointPathFromUrl(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return OPENAI_CHAT_COMPLETIONS_RELATIVE_PATH;
  }
}
