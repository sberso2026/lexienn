"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logVoiceDiagnostic } from "@/lib/app/voiceDiagnostics";
import {
  AUDIO_PLAYBACK_ERROR_MESSAGE,
  AutoplayBlockedError,
  AudioPlaybackTimeoutError,
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

export type VoiceAudioState = "audio_idle" | "audio_loading" | "audio_playing" | "audio_error";

export type VoicePlaybackState = {
  isPlaying: boolean;
  audioState: VoiceAudioState;
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
  language: string;
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
  audioState: "audio_idle",
  audioType: null,
  statusMessage: null,
  canPlay: true,
};

const TTS_REQUEST_TIMEOUT_MS = 8_000;

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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out.`));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
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
  const playGenerationRef = useRef(0);

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
      const generation = ++playGenerationRef.current;
      const effectiveText = overrides?.text ?? text;
      const effectivePronunciation = overrides?.pronunciationSimple ?? pronunciationSimple;
      const effectiveNativeUrl = overrides?.nativeAudioUrl ?? nativeAudioUrl;
      const effectiveCacheKey = overrides?.offlineCacheKey ?? offlineCacheKey;
      const selectionValue = languageSelection ?? language;
      const resolved = resolveLanguageSelection(selectionValue);

      if (disabled || !effectiveText.trim()) {
        setState((current) => ({
          ...current,
          audioState: "audio_error",
          statusMessage: OFFLINE_UNAVAILABLE_MESSAGE,
          audioType: "unavailable",
          isPlaying: false,
        }));
        return { success: false };
      }

      stopVoicePlayback();
      logVoiceDiagnostic("audio_request_start");
      setState({
        isPlaying: false,
        audioState: "audio_loading",
        audioType: null,
        statusMessage: null,
        canPlay: true,
      });

      const failPlayback = (message: string, autoplayBlocked = false): VoicePlayResult => {
        if (generation !== playGenerationRef.current) return { success: false };
        logVoiceDiagnostic("audio_error", {
          code: autoplayBlocked ? "autoplay_blocked" : "playback_failed",
        });
        setState({
          isPlaying: false,
          audioState: "audio_error",
          audioType: "unavailable",
          statusMessage: message,
          canPlay: true,
        });
        return { success: false, autoplayBlocked };
      };

      try {
        if (offlineMode && effectiveCacheKey) {
          const cachedAudio = await getOfflineEntryAudio(effectiveCacheKey);
          if (generation !== playGenerationRef.current) return { success: false };

          if (cachedAudio) {
            setState((current) => ({
              ...current,
              audioState: "audio_playing",
              isPlaying: true,
            }));
            logVoiceDiagnostic("audio_play_start");

            try {
              await playAudioFromBase64(
                cachedAudio.audio_base64,
                cachedAudio.audio_mime_type ?? "audio/mpeg",
              );
            } catch (error) {
              if (error instanceof AutoplayBlockedError) {
                return failPlayback(
                  "Tap Play again. Your browser blocked automatic playback.",
                  true,
                );
              }
              if (error instanceof AudioPlaybackTimeoutError) {
                return failPlayback(AUDIO_PLAYBACK_ERROR_MESSAGE);
              }
              throw error;
            }

            if (generation !== playGenerationRef.current) return { success: false };
            logVoiceDiagnostic("audio_play_end");
            logVoiceDiagnostic("audio_request_end");
            setState({
              isPlaying: false,
              audioState: "audio_idle",
              audioType: "ai_generated",
              statusMessage: "Playing downloaded phrase audio.",
              canPlay: true,
            });
            return { success: true };
          }
        }

        if (effectiveNativeUrl) {
          setState((current) => ({
            ...current,
            audioState: "audio_playing",
            isPlaying: true,
          }));
          logVoiceDiagnostic("audio_play_start");
          await playAudioFromUrl(effectiveNativeUrl);
          if (generation !== playGenerationRef.current) return { success: false };
          logVoiceDiagnostic("audio_play_end");
          setState({
            isPlaying: false,
            audioState: "audio_idle",
            audioType: "native_recorded",
            statusMessage: "Playing native recorded audio.",
            canPlay: true,
          });
          return { success: true };
        }

        const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

        if (!offlineMode && isOnline) {
          try {
            const voiceLanguageCode = resolveVoiceLanguageCode(resolved);
            const response = await withTimeout(
              requestVoiceSpeech({
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
              }),
              TTS_REQUEST_TIMEOUT_MS,
              "Voice request",
            );

            if (generation !== playGenerationRef.current) return { success: false };

            if (response.audio_type === "ai_generated" && response.audio_base64) {
              setState((current) => ({
                ...current,
                audioState: "audio_playing",
                isPlaying: true,
              }));
              logVoiceDiagnostic("audio_play_start");

              try {
                await playAudioFromBase64(
                  response.audio_base64,
                  response.audio_mime_type ?? "audio/mpeg",
                );
              } catch (error) {
                if (error instanceof AutoplayBlockedError) {
                  return failPlayback(
                    "Tap Repeat Slowly to play audio. Your browser blocked automatic playback.",
                    true,
                  );
                }
                if (error instanceof AudioPlaybackTimeoutError) {
                  return failPlayback(AUDIO_PLAYBACK_ERROR_MESSAGE);
                }
                throw error;
              }

              if (generation !== playGenerationRef.current) return { success: false };
              logVoiceDiagnostic("audio_play_end");
              logVoiceDiagnostic("audio_request_end");
              setState({
                isPlaying: false,
                audioState: "audio_idle",
                audioType: "ai_generated",
                statusMessage: "Playing AI local-style voice.",
                canPlay: true,
              });
              return { success: true };
            }

            if (response.audio_type === "native_recorded" && response.audio_url) {
              setState((current) => ({
                ...current,
                audioState: "audio_playing",
                isPlaying: true,
              }));
              logVoiceDiagnostic("audio_play_start");
              await playAudioFromUrl(response.audio_url);
              if (generation !== playGenerationRef.current) return { success: false };
              logVoiceDiagnostic("audio_play_end");
              setState({
                isPlaying: false,
                audioState: "audio_idle",
                audioType: "native_recorded",
                statusMessage: response.warning_message ?? "Playing native recorded audio.",
                canPlay: true,
              });
              return { success: true };
            }

            if (response.audio_type === "unavailable") {
              return failPlayback(response.warning_message ?? OFFLINE_UNAVAILABLE_MESSAGE);
            }
          } catch (error) {
            if (generation !== playGenerationRef.current) return { success: false };
            if (error instanceof VoiceApiError) {
              logVoiceDiagnostic("audio_error", { code: "voice_api_error" });
            }
          }
        }

        if (!isBrowserSpeechSupported()) {
          return failPlayback(
            offlineMode ? OFFLINE_UNAVAILABLE_MESSAGE : "Voice unavailable on this device.",
          );
        }

        const voiceLanguageCode = resolveVoiceLanguageCode(resolved);
        setState((current) => ({
          ...current,
          audioState: "audio_playing",
          isPlaying: true,
        }));
        logVoiceDiagnostic("audio_play_start");

        const browserResult = await speakWithBrowserFallback(effectiveText, {
          languageCode: voiceLanguageCode,
          pronunciationSimple: effectivePronunciation,
          rate: browserRate(speed, voiceLanguageCode),
          preferLocalVoices: offlineMode,
          preferRomanizedWithoutLocalVoice: offlineMode,
        });

        if (generation !== playGenerationRef.current) return { success: false };

        if (!browserResult.success) {
          return failPlayback(
            offlineMode ? OFFLINE_UNAVAILABLE_MESSAGE : "Voice unavailable on this device.",
          );
        }

        logVoiceDiagnostic("audio_play_end");
        logVoiceDiagnostic("audio_request_end");
        setState({
          isPlaying: false,
          audioState: "audio_idle",
          audioType: "browser_fallback",
          statusMessage: browserResult.statusMessage || BROWSER_FALLBACK_MESSAGE,
          canPlay: true,
        });
        return { success: true };
      } catch (error) {
        if (generation !== playGenerationRef.current) return { success: false };

        if (error instanceof AutoplayBlockedError) {
          return failPlayback(
            "Tap Repeat Slowly to play audio. Your browser blocked automatic playback.",
            true,
          );
        }

        return failPlayback(AUDIO_PLAYBACK_ERROR_MESSAGE);
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
    playGenerationRef.current += 1;
    stopVoicePlayback();
    setState((current) => ({
      ...current,
      isPlaying: false,
      audioState: "audio_idle",
    }));
  }, []);

  return { ...state, play, stop };
}
