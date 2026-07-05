import {
  voiceSpeakRequestSchema,
  voiceSpeakResponseSchema,
  type VoiceSpeakRequest,
  type VoiceSpeakResponse,
} from "@/lib/voice/voiceSchemas";

export class VoiceApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoiceApiError";
  }
}

export async function requestVoiceSpeech(
  request: VoiceSpeakRequest,
): Promise<VoiceSpeakResponse> {
  const parsed = voiceSpeakRequestSchema.safeParse(request);
  if (!parsed.success) {
    throw new VoiceApiError("Invalid voice request.");
  }

  let response: Response;
  try {
    response = await fetch("/api/voice/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
  } catch {
    throw new VoiceApiError("Could not reach the voice service.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new VoiceApiError("Voice service returned an invalid response.");
  }

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error?: unknown }).error === "string"
        ? (body as { error: string }).error
        : "Voice generation failed.";
    throw new VoiceApiError(message);
  }

  const validated = voiceSpeakResponseSchema.safeParse(body);
  if (!validated.success) {
    throw new VoiceApiError("Voice service returned an invalid response.");
  }

  return validated.data;
}

export async function fetchVoiceStatus(): Promise<{
  voice_enabled: boolean;
  provider_configured: boolean;
  fallback_enabled: boolean;
} | null> {
  try {
    const response = await fetch("/api/voice/status");
    if (!response.ok) return null;
    const body = (await response.json()) as {
      voice_enabled?: boolean;
      provider_configured?: boolean;
      fallback_enabled?: boolean;
    };
    return {
      voice_enabled: Boolean(body.voice_enabled),
      provider_configured: Boolean(body.provider_configured),
      fallback_enabled: body.fallback_enabled !== false,
    };
  } catch {
    return null;
  }
}
