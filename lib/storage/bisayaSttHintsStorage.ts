export const BISAYA_STT_HINTS_STORAGE_KEY = "lexienn_bisaya_stt_hints";
export const BISAYA_STT_HINTS_UPDATED_EVENT = "lexienn:bisaya-stt-hints-updated";

const MAX_STORED = 80;

export type TaughtBisayaPhrase = {
  id: string;
  phrase: string;
  language: "ceb";
  savedAt: string;
};

export function loadTaughtBisayaPhrases(): TaughtBisayaPhrase[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(BISAYA_STT_HINTS_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return (parsed as TaughtBisayaPhrase[])
      .filter((item) => item?.phrase && item.language === "ceb")
      .slice(0, MAX_STORED);
  } catch {
    return [];
  }
}

export function loadTaughtBisayaPhraseTexts(): string[] {
  return loadTaughtBisayaPhrases().map((item) => item.phrase);
}

/** Save a user-corrected Bisaya phrase for future STT hints. Never stores audio. */
export function teachBisayaPhrase(
  phrase: string,
): "saved" | "duplicate" | "empty" | "error" {
  if (typeof window === "undefined") return "error";
  const cleaned = phrase.replace(/\s+/g, " ").trim();
  if (!cleaned) return "empty";
  try {
    const saved = loadTaughtBisayaPhrases();
    const duplicate = saved.some(
      (item) => item.phrase.trim().toLowerCase() === cleaned.toLowerCase(),
    );
    if (duplicate) return "duplicate";
    const next: TaughtBisayaPhrase = {
      id: `bisaya-${Date.now()}`,
      phrase: cleaned.slice(0, 200),
      language: "ceb",
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      BISAYA_STT_HINTS_STORAGE_KEY,
      JSON.stringify([next, ...saved].slice(0, MAX_STORED)),
    );
    window.dispatchEvent(new Event(BISAYA_STT_HINTS_UPDATED_EVENT));
    return "saved";
  } catch {
    return "error";
  }
}
