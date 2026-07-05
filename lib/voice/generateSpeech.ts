import { cleanTextForSpeech, resolveSpeechText } from "@/lib/audio/speechText";
import { getVoiceConfig } from "@/lib/voice/voiceConfig";
import { requestOpenAiSpeech } from "@/lib/voice/voiceProviderClient";
import type { VoiceSpeakRequest, VoiceSpeakResponse } from "@/lib/voice/voiceSchemas";
import { BROWSER_FALLBACK_MESSAGE, OFFLINE_UNAVAILABLE_MESSAGE } from "@/lib/voice/browserSpeech";

function resolveSpeakText(request: VoiceSpeakRequest): string {
  return resolveSpeechText(request.text, request.pronunciation_simple, {
    languageCode: request.language,
    preferRomanizedWithoutVoice: false,
  });
}

function browserFallbackResponse(warningMessage?: string): VoiceSpeakResponse {
  const config = getVoiceConfig();
  return {
    audio_type: "browser_fallback",
    provider: config.provider,
    warning_message: warningMessage ?? BROWSER_FALLBACK_MESSAGE,
  };
}

function unavailableResponse(message: string): VoiceSpeakResponse {
  const config = getVoiceConfig();
  return {
    audio_type: "unavailable",
    provider: config.provider,
    warning_message: message,
  };
}

export async function generateSpeech(
  request: VoiceSpeakRequest,
): Promise<VoiceSpeakResponse> {
  const config = getVoiceConfig();
  const text = resolveSpeakText(request);

  if (!text) {
    return unavailableResponse("No text available for voice playback.");
  }

  if (request.voice_mode === "native_recorded") {
    if (request.audio_url) {
      return {
        audio_url: request.audio_url,
        audio_type: "native_recorded",
        provider: config.provider,
      };
    }

    if (config.fallbackEnabled) {
      return browserFallbackResponse();
    }

    return unavailableResponse(OFFLINE_UNAVAILABLE_MESSAGE);
  }

  if (request.voice_mode === "browser_fallback") {
    return browserFallbackResponse();
  }

  if (!config.isConfigured) {
    if (config.fallbackEnabled) {
      return browserFallbackResponse();
    }
    return unavailableResponse("AI voice is not configured.");
  }

  const speed = request.speed === "slow" ? 0.75 : 1;

  const audioBuffer = await requestOpenAiSpeech({
    text: cleanTextForSpeech(text) || text,
    model: config.model,
    voice: config.voiceName,
    speed,
    instructions: request.voice_instruction,
  });

  if (!audioBuffer) {
    if (config.fallbackEnabled) {
      return browserFallbackResponse();
    }
    return unavailableResponse("Voice generation is temporarily unavailable.");
  }

  // TODO: cache generated audio by hash(text + language + speed + voice model).

  return {
    audio_base64: Buffer.from(audioBuffer).toString("base64"),
    audio_mime_type: "audio/mpeg",
    audio_type: "ai_generated",
    provider: config.provider,
  };
}
