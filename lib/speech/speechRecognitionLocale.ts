import { getBcp47Lang } from "@/lib/audio/speechSynthesis";

/** Map a language hint / ISO code to a speech-recognition BCP-47 locale. */
export function mapSpeechRecognitionLocale(languageHint: string): string {
  const normalized = languageHint.trim().toLowerCase();
  if (!normalized) return "en-US";
  if (normalized.includes("-") && normalized.length >= 5) return normalized;

  const base = normalized.split(/[:_]/)[0] ?? normalized;
  const overrides: Record<string, string> = {
    en: "en-US",
    tl: "fil-PH",
    fil: "fil-PH",
    ga: "ga-IE",
    fa: "fa-IR",
    ur: "ur-PK",
    he: "he-IL",
    az: "az-AZ",
    ceb: "fil-PH",
    hil: "fil-PH",
    ilo: "fil-PH",
    war: "fil-PH",
  };

  if (overrides[base]) return overrides[base];
  return getBcp47Lang(base);
}
