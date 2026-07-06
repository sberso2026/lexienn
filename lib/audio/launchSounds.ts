export type LaunchSoundCue =
  | "blueSwoosh"
  | "redSwoosh"
  | "bookLock"
  | "starLock"
  | "finalBurst";

const SOUND_FILES: Record<LaunchSoundCue, string> = {
  blueSwoosh: "/sounds/lexienn-metal-1.mp3",
  redSwoosh: "/sounds/lexienn-metal-2.mp3",
  bookLock: "/sounds/lexienn-metal-3.mp3",
  starLock: "/sounds/lexienn-metal-3.mp3",
  finalBurst: "/sounds/lexienn-final-burst.mp3",
};

const DEFAULT_VOLUME = 0.35;

let audioContext: AudioContext | null = null;
const audioCache = new Map<LaunchSoundCue, HTMLAudioElement>();

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

function playSynthClick(cue: LaunchSoundCue): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const profiles: Record<LaunchSoundCue, { freq: number; duration: number }> = {
    blueSwoosh: { freq: 520, duration: 0.12 },
    redSwoosh: { freq: 380, duration: 0.12 },
    bookLock: { freq: 280, duration: 0.1 },
    starLock: { freq: 640, duration: 0.08 },
    finalBurst: { freq: 220, duration: 0.28 },
  };

  const profile = profiles[cue];
  osc.type = cue === "finalBurst" ? "sawtooth" : "triangle";
  osc.frequency.setValueAtTime(profile.freq, now);
  osc.frequency.exponentialRampToValueAtTime(profile.freq * 0.5, now + profile.duration);
  gain.gain.setValueAtTime(DEFAULT_VOLUME * 0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + profile.duration);
  osc.start(now);
  osc.stop(now + profile.duration + 0.02);
}

function getAudioElement(cue: LaunchSoundCue): HTMLAudioElement {
  const cached = audioCache.get(cue);
  if (cached) return cached;
  const audio = new Audio(SOUND_FILES[cue]);
  audio.preload = "auto";
  audio.volume = DEFAULT_VOLUME;
  audioCache.set(cue, audio);
  return audio;
}

export async function preloadLaunchSounds(): Promise<void> {
  if (typeof window === "undefined") return;
  for (const cue of Object.keys(SOUND_FILES) as LaunchSoundCue[]) {
    try {
      const audio = getAudioElement(cue);
      audio.load();
    } catch {
      // ignore preload errors
    }
  }
}

export async function playLaunchSound(cue: LaunchSoundCue): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const audio = getAudioElement(cue);
    audio.currentTime = 0;
    await audio.play();
  } catch {
    try {
      const ctx = getAudioContext();
      if (ctx?.state === "suspended") await ctx.resume();
      playSynthClick(cue);
    } catch {
      // silent fallback — never break launch flow
    }
  }
}

export async function resumeLaunchAudioContext(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (ctx?.state === "suspended") await ctx.resume();
  } catch {
    // ignore
  }
}
