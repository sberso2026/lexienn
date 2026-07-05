import { getVoiceConfig, getVoiceTimeoutMs } from "@/lib/voice/voiceConfig";

export type OpenAiSpeechRequest = {
  text: string;
  model: string;
  voice: string;
  speed?: number;
  instructions?: string;
};

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(timeoutMs);
  }

  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function logVoiceDiagnostic(message: string): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn("[voice]", message);
}

export async function requestOpenAiSpeech(
  body: OpenAiSpeechRequest,
): Promise<ArrayBuffer | null> {
  const config = getVoiceConfig();
  if (!config.isConfigured) return null;

  const timeoutMs = getVoiceTimeoutMs();
  let response: Response;

  try {
    response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: body.model,
        input: body.text,
        voice: body.voice,
        response_format: "mp3",
        speed: body.speed ?? 1,
        ...(body.instructions ? { instructions: body.instructions } : {}),
      }),
      signal: createTimeoutSignal(timeoutMs),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "network_error";
    if (name === "TimeoutError" || name === "AbortError") {
      logVoiceDiagnostic(`request timed out after ${timeoutMs}ms`);
    } else {
      logVoiceDiagnostic(
        `request failed: ${error instanceof Error ? error.message : "network error"}`,
      );
    }
    return null;
  }

  if (!response.ok) {
    logVoiceDiagnostic(`request failed with status ${response.status}`);
    return null;
  }

  try {
    return await response.arrayBuffer();
  } catch {
    logVoiceDiagnostic("response was not valid audio");
    return null;
  }
}
