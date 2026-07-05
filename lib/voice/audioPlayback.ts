import { stopBrowserSpeech } from "@/lib/voice/browserSpeech";

let currentAudio: HTMLAudioElement | null = null;

export class AutoplayBlockedError extends Error {
  constructor() {
    super("Autoplay blocked by browser.");
    this.name = "AutoplayBlockedError";
  }
}

export function stopVoicePlayback(): void {
  stopBrowserSpeech();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}

function playAudioElement(audio: HTMLAudioElement): Promise<void> {
  currentAudio = audio;
  return new Promise((resolve, reject) => {
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
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
}

export async function playAudioFromBase64(
  base64: string,
  mimeType = "audio/mpeg",
): Promise<void> {
  stopVoicePlayback();
  const audio = new Audio(`data:${mimeType};base64,${base64}`);
  await playAudioElement(audio);
}

export async function playAudioFromUrl(url: string): Promise<void> {
  stopVoicePlayback();
  const audio = new Audio(url);
  await playAudioElement(audio);
}
