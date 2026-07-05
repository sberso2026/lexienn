"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AutoplayBlockedError,
  playAudioFromBase64,
  playAudioFromUrl,
  stopVoicePlayback,
} from "@/lib/voice/audioPlayback";
import {
  BROWSER_FALLBACK_MESSAGE,
  OFFLINE_UNAVAILABLE_MESSAGE,
  isBrowserSpeechSupported,
  speakWithBrowserFallback,
} from "@/lib/voice/browserSpeech";
import {
  buildVoiceInstruction,
  resolveLanguageSelection,
} from "@/lib/languages/languageOptions";
import { requestVoiceSpeech, VoiceApiError } from "@/lib/voice/voiceApiClient";
import { getOfflineEntryAudio } from "@/lib/offline/offlineAudioCache";
import type { VoiceAudioType, VoiceSpeed } from "@/lib/voice/voiceSchemas";

export type VoicePlaybackState = {
  isPlaying: boolean;
  audioType: VoiceAudioType | null;
  statusMessage: string | null;
  canPlay: boolean;
};

export type VoicePlayResult = {
  success: boolean;
  autoplayBlocked?: boolean;
};

export type UseVoicePlaybackOptions = {
  text: string;
  /** Base language code or composite selection value. */
  language: string;
  /** Composite target selection value (language + dialect). */
  languageSelection?: string;
  dialect?: string;
  pronunciationSimple?: string;
  nativeAudioUrl?: string;
  offlineCacheKey?: string;
  offlineMode?: boolean;
  disabled?: boolean;
};

const INITIAL_STATE: VoicePlaybackState = {
  isPlaying: false,
  audioType: null,
  statusMessage: null,
  canPlay: true,
};

function browserRate(speed: VoiceSpeed, language: string): number {
  if (speed === "slow") return 0.65;
  const base = language.split("::")[0]?.split("-")[0];
  return base === "en" ? 1 : 0.92;
}

function resolveVoiceLanguageCode(
  resolved: ReturnType<typeof resolveLanguageSelection>,
): string {
  if (resolved.dialect_variant) return resolved.base_language;
  return resolved.selection_value;
}

export function useVoicePlayback(options: UseVoicePlaybackOptions) {
  const {
    text,
    language,
    languageSelection,
    dialect,
    pronunciationSimple,
    nativeAudioUrl,
    offlineCacheKey,
    offlineMode = false,
    disabled = false,
  } = options;

  const [state, setState] = useState<VoicePlaybackState>(INITIAL_STATE);

  useEffect(() => {
    return () => stopVoicePlayback();
  }, []);

  const play = useCallback(
    async (
      speed: VoiceSpeed = "normal",
      overrides?: Partial<
        Pick<
          UseVoicePlaybackOptions,
          "text" | "pronunciationSimple" | "nativeAudioUrl" | "offlineCacheKey"
        >
      >,
    ): Promise<VoicePlayResult> => {
      const effectiveText = overrides?.text ?? text;
      const effectivePronunciation = overrides?.pronunciationSimple ?? pronunciationSimple;
      const effectiveNativeUrl = overrides?.nativeAudioUrl ?? nativeAudioUrl;
      const effectiveCacheKey = overrides?.offlineCacheKey ?? offlineCacheKey;
      const selectionValue = languageSelection ?? language;
      const resolved = resolveLanguageSelection(selectionValue);

      if (disabled || !effectiveText.trim()) {
        setState((current) => ({
          ...current,
          statusMessage: OFFLINE_UNAVAILABLE_MESSAGE,
          audioType: "unavailable",
        }));
        return { success: false };
      }

      stopVoicePlayback();
      setState((current) => ({
        ...current,
        isPlaying: true,
        statusMessage: null,
        canPlay: true,
      }));

      try {
        if (offlineMode && effectiveCacheKey) {
          const cachedAudio = await getOfflineEntryAudio(effectiveCacheKey);
          if (cachedAudio) {
            try {
              await playAudioFromBase64(
                cachedAudio.audio_base64,
                cachedAudio.audio_mime_type ?? "audio/mpeg",
              );
            } catch (error) {
              if (error instanceof AutoplayBlockedError) {
                setState({
                  isPlaying: false,
                  audioType: "ai_generated",
                  statusMessage:
                    "Tap Play again. Your browser blocked automatic playback.",
                  canPlay: true,
                });
                return { success: false, autoplayBlocked: true };
              }
              throw error;
            }

            setState({
              isPlaying: false,
              audioType: "ai_generated",
              statusMessage: "Playing downloaded phrase audio.",
              canPlay: true,
            });
            return { success: true };
          }
        }

        if (effectiveNativeUrl) {
          await playAudioFromUrl(effectiveNativeUrl);
          setState({
            isPlaying: false,
            audioType: "native_recorded",
            statusMessage: "Playing native recorded audio.",
            canPlay: true,
          });
          return { success: true };
        }

        const isOnline =
          typeof navigator !== "undefined" ? navigator.onLine : true;

        if (!offlineMode && isOnline) {
          try {
            const voiceLanguageCode = resolveVoiceLanguageCode(resolved);
            const response = await requestVoiceSpeech({
              text: effectiveText,
              language: voiceLanguageCode,
              dialect: resolved.dialect_variant ?? dialect,
              dialect_label: resolved.dialect_label,
              region: resolved.region,
              locale_tag: resolved.locale_tag,
              voice_instruction: buildVoiceInstruction(resolved),
              speed,
              voice_mode: "ai",
              pronunciation_simple: effectivePronunciation,
            });

            if (response.audio_type === "ai_generated" && response.audio_base64) {
              try {
                await playAudioFromBase64(
                  response.audio_base64,
                  response.audio_mime_type ?? "audio/mpeg",
                );
              } catch (error) {
                if (error instanceof AutoplayBlockedError) {
                  setState({
                    isPlaying: false,
                    audioType: "ai_generated",
                    statusMessage:
                      "Tap Repeat Slowly to play audio. Your browser blocked automatic playback.",
                    canPlay: true,
                  });
                  return { success: false, autoplayBlocked: true };
                }
                throw error;
              }
              setState({
                isPlaying: false,
                audioType: "ai_generated",
                statusMessage: "Playing AI local-style voice.",
                canPlay: true,
              });
              return { success: true };
            }

            if (response.audio_type === "native_recorded" && response.audio_url) {
              await playAudioFromUrl(response.audio_url);
              setState({
                isPlaying: false,
                audioType: "native_recorded",
                statusMessage: response.warning_message ?? "Playing native recorded audio.",
                canPlay: true,
              });
              return { success: true };
            }

            if (response.audio_type === "unavailable") {
              setState({
                isPlaying: false,
                audioType: "unavailable",
                statusMessage:
                  response.warning_message ?? OFFLINE_UNAVAILABLE_MESSAGE,
                canPlay: false,
              });
              return { success: false };
            }
          } catch (error) {
            if (!(error instanceof VoiceApiError)) {
              // Continue to browser fallback below.
            }
          }
        }

        if (!isBrowserSpeechSupported()) {
          setState({
            isPlaying: false,
            audioType: "unavailable",
            statusMessage: offlineMode
              ? OFFLINE_UNAVAILABLE_MESSAGE
              : "Voice unavailable on this device.",
            canPlay: false,
          });
          return { success: false };
        }

        const voiceLanguageCode = resolveVoiceLanguageCode(resolved);

        const browserResult = await speakWithBrowserFallback(effectiveText, {
          languageCode: voiceLanguageCode,
          pronunciationSimple: effectivePronunciation,
          rate: browserRate(speed, voiceLanguageCode),
          preferLocalVoices: offlineMode,
          preferRomanizedWithoutLocalVoice: offlineMode,
        });

        if (!browserResult.success) {
          setState({
            isPlaying: false,
            audioType: "unavailable",
            statusMessage: offlineMode
              ? OFFLINE_UNAVAILABLE_MESSAGE
              : "Voice unavailable on this device.",
            canPlay: false,
          });
          return { success: false };
        }

        setState({
          isPlaying: false,
          audioType: "browser_fallback",
          statusMessage: browserResult.statusMessage || BROWSER_FALLBACK_MESSAGE,
          canPlay: true,
        });
        return { success: true };
      } catch (error) {
        if (error instanceof AutoplayBlockedError) {
          setState({
            isPlaying: false,
            audioType: "unavailable",
            statusMessage:
              "Tap Repeat Slowly to play audio. Your browser blocked automatic playback.",
            canPlay: true,
          });
          return { success: false, autoplayBlocked: true };
        }

        setState({
          isPlaying: false,
          audioType: "unavailable",
          statusMessage: offlineMode
            ? OFFLINE_UNAVAILABLE_MESSAGE
            : "Voice playback failed.",
          canPlay: false,
        });
        return { success: false };
      }
    },
    [
      disabled,
      text,
      language,
      languageSelection,
      dialect,
      pronunciationSimple,
      nativeAudioUrl,
      offlineCacheKey,
      offlineMode,
    ],
  );

  const stop = useCallback(() => {
    stopVoicePlayback();
    setState((current) => ({ ...current, isPlaying: false }));
  }, []);

  return { ...state, play, stop };
}
