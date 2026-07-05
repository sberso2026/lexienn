"use client";

import { useEffect, useState } from "react";
import {
  getCachedVoices,
  preloadSpeechVoices,
  selectVoiceForLanguage,
} from "@/lib/audio/speechSynthesis";

export function useSpeechVoices(languageCode: string) {
  const [ready, setReady] = useState(false);
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<string | null>(null);
  const [hasVoice, setHasVoice] = useState(false);

  useEffect(() => {
    let active = true;

    const syncVoice = () => {
      if (!active) return;
      const { voice } = selectVoiceForLanguage(languageCode);
      setVoiceName(voice?.name ?? null);
      setVoiceLang(voice?.lang ?? null);
      setHasVoice(voice !== null);
      setReady(true);
    };

    preloadSpeechVoices().then(syncVoice);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.addEventListener("voiceschanged", syncVoice);
    }

    return () => {
      active = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.removeEventListener("voiceschanged", syncVoice);
      }
    };
  }, [languageCode]);

  return {
    ready,
    hasVoice,
    voiceName,
    voiceLang,
    voiceCount: getCachedVoices().length,
  };
}
