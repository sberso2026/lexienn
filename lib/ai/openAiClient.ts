import { getAiConfig, getAiTimeoutMs } from "@/lib/ai/config";

export type OpenAiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAiChatRequest = {
  model: string;
  temperature: number;
  response_format?: { type: "json_object" };
  messages: OpenAiChatMessage[];
};

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function logOpenAiDiagnostic(message: string): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn("[openai]", message);
}

export async function requestOpenAiChatCompletion(
  body: OpenAiChatRequest,
  options: { timeoutMs?: number } = {},
): Promise<string | null> {
  const config = getAiConfig();
  if (!config.isConfigured) return null;

  const timeoutMs = options.timeoutMs ?? getAiTimeoutMs();
  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: createTimeoutSignal(timeoutMs),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "network_error";
    if (name === "TimeoutError" || name === "AbortError") {
      logOpenAiDiagnostic(`request timed out after ${timeoutMs}ms`);
    } else {
      logOpenAiDiagnostic(
        `request failed: ${error instanceof Error ? error.message : "network error"}`,
      );
    }
    return null;
  }

  if (!response.ok) {
    logOpenAiDiagnostic(`request failed with status ${response.status}`);
    return null;
  }

  try {
    const payload = (await response.json()) as OpenAiChatResponse;
    return payload.choices?.[0]?.message?.content ?? null;
  } catch {
    logOpenAiDiagnostic("response was not valid JSON");
    return null;
  }
}
