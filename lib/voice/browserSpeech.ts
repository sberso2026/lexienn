import {
  isSpeechSynthesisSupported,
  speakTextAsync,
  stopSpeaking,
  type SpeakOptions,
  type SpeakResult,
} from "@/lib/audio/speechSynthesis";

export const BROWSER_FALLBACK_MESSAGE =
  "Device voice fallback. Accent may not match the selected local dialect.";

export const BROWSER_FALLBACK_STATUS =
  "Using device voice fallback. Audio quality depends on installed system voices.";

export const OFFLINE_UNAVAILABLE_MESSAGE =
  "Voice unavailable offline. Showing text and pronunciation instead.";

export const MISSING_DEVICE_VOICE_MESSAGE =
  "Install the target language voice in system settings for better pronunciation on this device.";

export type BrowserSpeechOptions = SpeakOptions & {
  languageCode: string;
  preferLocalVoices?: boolean;
  preferRomanizedWithoutLocalVoice?: boolean;
};

export type BrowserSpeechResult = SpeakResult & {
  statusMessage: string;
};

export function isBrowserSpeechSupported(): boolean {
  return isSpeechSynthesisSupported();
}

export function stopBrowserSpeech(): void {
  stopSpeaking();
}

export async function speakWithBrowserFallback(
  text: string,
  options: BrowserSpeechOptions,
): Promise<BrowserSpeechResult> {
  const { languageCode, ...speakOptions } = options;
  const result = await speakTextAsync(text, languageCode, speakOptions);

  let statusMessage = BROWSER_FALLBACK_STATUS;
  if (result.noLocalVoice) {
    statusMessage = `${BROWSER_FALLBACK_STATUS} ${MISSING_DEVICE_VOICE_MESSAGE}`;
  } else if (result.voiceName) {
    statusMessage = `${BROWSER_FALLBACK_STATUS} Speaking with ${result.voiceName}.`;
  }

  return {
    ...result,
    statusMessage,
  };
}
