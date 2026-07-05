import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/voice/status/route";
import { POST } from "@/app/api/voice/speak/route";
import { buildVoiceInstruction, resolveLanguageSelection } from "@/lib/languages/languageOptions";
import { getVoiceStatus } from "@/lib/voice/voiceConfig";
import { generateSpeech } from "@/lib/voice/generateSpeech";
import * as voiceProvider from "@/lib/voice/voiceProviderClient";

describe("GET /api/voice/status", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns status fields and never exposes the API key", async () => {
    vi.stubEnv("VOICE_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "super-secret-key");
    vi.stubEnv("VOICE_PROVIDER", "openai");
    vi.stubEnv("VOICE_MODEL", "gpt-4o-mini-tts");
    vi.stubEnv("VOICE_FALLBACK_ENABLED", "true");

    const response = await GET();
    const body = await response.json();

    expect(body).toEqual(getVoiceStatus());
    expect(body.voice_enabled).toBe(true);
    expect(body.provider_configured).toBe(true);
    expect(body.model_configured).toBe(true);
    expect(JSON.stringify(body)).not.toContain("super-secret-key");
    expect(body).not.toHaveProperty("api_key");
  });
});

describe("generateSpeech", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns browser fallback when AI voice is not configured", async () => {
    vi.stubEnv("VOICE_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("VOICE_MODEL", "gpt-4o-mini-tts");
    vi.stubEnv("VOICE_FALLBACK_ENABLED", "true");

    const result = await generateSpeech({
      text: "Kumusta",
      language: "tl",
      speed: "normal",
      voice_mode: "ai",
    });

    expect(result.audio_type).toBe("browser_fallback");
    expect(result.warning_message).toMatch(/device voice fallback/i);
  });

  it("returns ai_generated audio when provider succeeds", async () => {
    vi.stubEnv("VOICE_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("VOICE_PROVIDER", "openai");
    vi.stubEnv("VOICE_MODEL", "gpt-4o-mini-tts");
    vi.stubEnv("VOICE_NAME", "alloy");

    vi.spyOn(voiceProvider, "requestOpenAiSpeech").mockResolvedValue(
      new TextEncoder().encode("fake-audio").buffer,
    );

    const result = await generateSpeech({
      text: "Kumusta",
      language: "tl",
      speed: "normal",
      voice_mode: "ai",
    });

    expect(result.audio_type).toBe("ai_generated");
    expect(result.audio_base64).toBeTruthy();
    expect(result.audio_mime_type).toBe("audio/mpeg");
  });

  it("passes voice instruction metadata for AI generation", async () => {
    vi.stubEnv("VOICE_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "test-key");
    vi.stubEnv("VOICE_PROVIDER", "openai");
    vi.stubEnv("VOICE_MODEL", "gpt-4o-mini-tts");

    const resolved = resolveLanguageSelection("sw");
    const instruction = buildVoiceInstruction(resolved);
    const speechSpy = vi.spyOn(voiceProvider, "requestOpenAiSpeech").mockResolvedValue(
      new TextEncoder().encode("fake-audio").buffer,
    );

    await generateSpeech({
      text: "Jambo",
      language: resolved.base_language,
      locale_tag: resolved.locale_tag,
      dialect_label: resolved.dialect_label,
      voice_instruction: instruction,
      speed: "normal",
      voice_mode: "ai",
    });

    expect(speechSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        instructions: expect.stringContaining("Speak naturally as a local speaker"),
      }),
    );
  });
});

describe("POST /api/voice/speak", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns browser fallback without exposing provider errors", async () => {
    vi.stubEnv("VOICE_ENABLED", "true");
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("VOICE_MODEL", "gpt-4o-mini-tts");
    vi.stubEnv("VOICE_FALLBACK_ENABLED", "true");

    const response = await POST(
      new Request("http://localhost/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Kumusta",
          language: "tl",
          speed: "normal",
          voice_mode: "ai",
        }),
      }),
    );

    const body = await response.json();
    expect(response.ok).toBe(true);
    expect(body.audio_type).toBe("browser_fallback");
    expect(JSON.stringify(body)).not.toContain("sk-");
  });
});
