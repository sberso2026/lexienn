import { resolveLanguageSelection } from "@/lib/languages/languageOptions";

const ISO_HINTS: Record<string, string> = {
  en: "English",
  tl: "Tagalog / Filipino",
  ceb: "Cebuano",
  zh: "Chinese (Simplified or Traditional)",
  yue: "Cantonese",
  ja: "Japanese",
  ko: "Korean",
  vi: "Vietnamese",
  th: "Thai",
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic",
  hi: "Hindi",
  auto: "auto-detect from image",
};

export function getOcrLanguageHint(sourceLanguageHint: string): string {
  if (!sourceLanguageHint || sourceLanguageHint === "auto") {
    return ISO_HINTS.auto;
  }

  try {
    const resolved = resolveLanguageSelection(sourceLanguageHint);
    return (
      ISO_HINTS[resolved.base_language] ??
      `${resolved.display_label} (${resolved.locale_tag})`
    );
  } catch {
    return ISO_HINTS.auto;
  }
}

export function normalizeDetectedLanguage(
  detected: string | undefined,
  fallbackHint: string,
): string {
  if (!detected?.trim()) {
    return fallbackHint === "auto" ? "unknown" : fallbackHint;
  }
  return detected.trim().toLowerCase();
}
