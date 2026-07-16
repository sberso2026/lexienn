export const SAVED_PHRASES_STORAGE_KEY = "lexienn_saved_phrases";
export const SAVED_PHRASES_UPDATED_EVENT = "lexienn:saved-phrases-updated";

export type SavedPhrase = {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  pronunciation?: string;
  savedAt: string;
};

export function loadSavedPhrases(): SavedPhrase[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_PHRASES_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as SavedPhrase[]) : [];
  } catch {
    return [];
  }
}

export function saveTranslatedPhrase(
  phrase: Omit<SavedPhrase, "id" | "savedAt">,
): "saved" | "duplicate" | "error" {
  if (typeof window === "undefined") return "error";
  try {
    const saved = loadSavedPhrases();
    const duplicate = saved.some(
      (item) =>
        item.sourceText.trim().toLowerCase() === phrase.sourceText.trim().toLowerCase() &&
        item.targetLanguage === phrase.targetLanguage,
    );
    if (duplicate) return "duplicate";
    const next: SavedPhrase = {
      ...phrase,
      id: `phrase-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVED_PHRASES_STORAGE_KEY, JSON.stringify([next, ...saved]));
    window.dispatchEvent(new Event(SAVED_PHRASES_UPDATED_EVENT));
    return "saved";
  } catch {
    return "error";
  }
}
