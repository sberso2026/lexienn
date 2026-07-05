/** Remove legacy prototype markers and parenthetical notes so TTS speaks only the local phrase. */
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\s*\(MVP mock[^)]*\)/gi, "")
    .replace(/\s*\([^)]*\bseed data\b[^)]*\)/gi, "")
    .replace(/\s*—\s*(MVP mock|seed data).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when text is mostly non-Latin (e.g. Devanagari, Arabic, CJK). */
export function containsNonLatinScript(text: string): boolean {
  return /[^\u0000-\u024F\u1E00-\u1EFF\s\d.,!?;:'"()\-–—]/.test(text);
}

export type ResolveSpeechTextOptions = {
  languageCode?: string;
  /** When true, use romanized pronunciation if no voice can read the script. */
  preferRomanizedWithoutVoice?: boolean;
  hasVoice?: boolean;
};

/** Prefer speaking the local phrase; fall back to pronunciation hint if needed. */
export function resolveSpeechText(
  targetText: string,
  pronunciationSimple?: string,
  options?: ResolveSpeechTextOptions,
): string {
  const cleaned = cleanTextForSpeech(targetText);
  const pronunciation = pronunciationSimple?.trim() ?? "";

  if (
    options?.preferRomanizedWithoutVoice &&
    options.languageCode &&
    options.languageCode !== "en" &&
    options.hasVoice === false &&
    containsNonLatinScript(cleaned) &&
    pronunciation.length > 0
  ) {
    return pronunciation;
  }

  if (cleaned.length > 0) {
    return cleaned;
  }

  return pronunciation || targetText.trim();
}
