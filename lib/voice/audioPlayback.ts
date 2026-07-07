import { stopBrowserSpeech } from "@/lib/voice/browserSpeech";

let currentAudio: HTMLAudioElement | null = null;
let playbackGeneration = 0;

export const AUDIO_PLAYBACK_ERROR_MESSAGE =
  "Audio could not play. Tap again or check volume/silent mode.";

export const PLAYBACK_START_TIMEOUT_MS = 3_000;

export class AutoplayBlockedError extends Error {
  constructor() {
    super("Autoplay blocked by browser.");
    this.name = "AutoplayBlockedError";
  }
}

export class AudioPlaybackTimeoutError extends Error {
  constructor() {
    super("Audio playback did not start in time.");
    this.name = "AudioPlaybackTimeoutError";
  }
}

export function stopVoicePlayback(): void {
  playbackGeneration += 1;
  stopBrowserSpeech();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function withPlaybackStartTimeout(playPromise: Promise<void>, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new AudioPlaybackTimeoutError());
    }, timeoutMs);

    playPromise
      .then(() => {
        window.clearTimeout(timer);
        resolve();
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function playAudioElement(audio: HTMLAudioElement, generation: number): Promise<void> {
  currentAudio = audio;
  const playPromise = new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      if (currentAudio === audio && generation === playbackGeneration) {
        currentAudio = null;
      }
      resolve();
    };
    audio.onerror = () => {
      if (currentAudio === audio) currentAudio = null;
      reject(new Error("Audio playback failed."));
    };
    void audio.play().catch((error: unknown) => {
      if (currentAudio === audio) currentAudio = null;
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        reject(new AutoplayBlockedError());
        return;
      }
      reject(error);
    });
  });

  return withPlaybackStartTimeout(playPromise, PLAYBACK_START_TIMEOUT_MS);
}

export async function playAudioFromBase64(
  base64: string,
  mimeType = "audio/mpeg",
): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Audio playback is only available in the browser.");
  }

  stopVoicePlayback();
  const generation = playbackGeneration;
  const audio = new Audio(`data:${mimeType};base64,${base64}`);
  await playAudioElement(audio, generation);
}

export async function playAudioFromUrl(url: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Audio playback is only available in the browser.");
  }

  stopVoicePlayback();
  const generation = playbackGeneration;
  const audio = new Audio(url);
  await playAudioElement(audio, generation);
}

export function isCurrentPlaybackGeneration(generation: number): boolean {
  return generation === playbackGeneration;
}
