import { cleanTextForSpeech, resolveSpeechText } from "./speechText";
import { isAustralianIndigenousLanguageCode } from "@/lib/languages/australianLanguages";
import { BLAAN_LANGUAGE_CODE } from "@/lib/languages/philippineIndigenousLanguages";

const BCP47_MAP: Record<string, string> = {
  en: "en-US",
  tl: "fil-PH",
  ceb: "fil-PH",
  hil: "fil-PH",
  ilo: "fil-PH",
  war: "fil-PH",
  id: "id-ID",
  ms: "ms-MY",
  es: "es-ES",
  vi: "vi-VN",
  th: "th-TH",
  zh: "zh-CN",
  ja: "ja-JP",
  ko: "ko-KR",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-PT",
  it: "it-IT",
  nl: "nl-NL",
  ru: "ru-RU",
  ar: "ar-SA",
  hi: "hi-IN",
  tr: "tr-TR",
  pl: "pl-PL",
  bn: "bn-BD",
  yue: "zh-HK",
  egy: "ar-EG",
  lo: "lo-LA",
  sw: "sw-KE",
  am: "am-ET",
  yo: "yo-NG",
  zu: "zu-ZA",
  ha: "ha-NG",
  ht: "ht-HT",
  qu: "qu-PE",
  gn: "gn-PY",
  ay: "ay-BO",
  bli: "bli-PH",
  "en-au": "en-AU",
  aer: "aer-AU",
  aly: "aly-AU",
  aoi: "aoi-AU",
  bdy: "bdy-AU",
  gup: "gup-AU",
  zku: "zku-AU",
  rop: "rop-AU",
  mwf: "mwf-AU",
  pjt: "pjt-AU",
  tcs: "tcs-AU",
  tiw: "tiw-AU",
  wbp: "wbp-AU",
  wrh: "wrh-AU",
  yol: "yol-AU",
};

/** Patterns to match installed voices (lang + name), most specific first. */
const VOICE_MATCH_PATTERNS: Record<string, string[]> = {
  tl: ["fil-ph", "fil", "tl-ph", "tagalog", "filipino", "philippines"],
  ceb: ["ceb", "bisaya", "cebuano", "fil-ph", "fil", "tagalog", "filipino"],
  hil: ["hil", "ilonggo", "hiligaynon", "fil-ph", "fil", "filipino"],
  ilo: ["ilo", "ilocano", "fil-ph", "fil"],
  war: ["war", "waray", "fil-ph", "fil"],
  id: ["id-id", "indonesian", "bahasa"],
  ms: ["ms-my", "malay"],
  es: ["es-es", "es-mx", "spanish"],
  vi: ["vi-vn", "vietnamese"],
  th: ["th-th", "thai"],
  zh: ["zh-cn", "zh-tw", "chinese", "mandarin"],
  ja: ["ja-jp", "japanese"],
  ko: ["ko-kr", "korean"],
  fr: ["fr-fr", "fr-ca", "french"],
  de: ["de-de", "german"],
  pt: ["pt-pt", "pt-br", "portuguese"],
  it: ["it-it", "italian"],
  nl: ["nl-nl", "dutch"],
  ru: ["ru-ru", "russian"],
  ar: ["ar-sa", "ar-ae", "arabic"],
  hi: ["hi-in", "hindi", "hemant", "kalpana", "swara", "madhur"],
  tr: ["tr-tr", "turkish"],
  pl: ["pl-pl", "pl", "polish", "paulina", "zofia", "adam"],
  bn: ["bn-bd", "bn-in", "bengali"],
  yue: ["zh-hk", "yue", "cantonese", "hong kong"],
  egy: ["ar-eg", "egypt", "egyptian", "arabic"],
  lo: ["lo-la", "lao", "laos"],
  sw: ["sw-ke", "sw", "swahili"],
  am: ["am-et", "amharic"],
  yo: ["yo-ng", "yoruba"],
  zu: ["zu-za", "zulu"],
  ha: ["ha-ng", "hausa"],
  ht: ["ht-ht", "haitian", "creole"],
  qu: ["qu-pe", "quechua"],
  gn: ["gn-py", "guarani"],
  ay: ["ay-bo", "aymara"],
  bli: ["bli-ph", "blaan", "b'laan"],
  "en-au": ["en-au", "australia", "australian", "english"],
  en: ["en-us", "en-gb", "english"],
};

/** When no dedicated voice exists, try these BCP-47 tags in order. */
const VOICE_LANG_FALLBACKS: Record<string, string[]> = {
  ceb: ["fil-PH", "id-ID", "ms-MY"],
  hil: ["fil-PH", "id-ID", "ms-MY"],
  ilo: ["fil-PH", "id-ID"],
  war: ["fil-PH", "id-ID"],
  tl: ["fil-PH", "id-ID"],
  hi: ["hi-IN", "hi"],
  pl: ["pl-PL", "pl"],
  bn: ["bn-IN", "bn-BD", "hi-IN"],
  yue: ["zh-HK", "zh-TW", "zh-CN"],
  egy: ["ar-EG", "ar-SA", "ar"],
  lo: ["lo-LA", "th-TH"],
  sw: ["sw-KE", "sw"],
  am: ["am-ET", "am"],
  yo: ["yo-NG", "en-NG"],
  zu: ["zu-ZA", "zu"],
  ha: ["ha-NG", "en-NG"],
  ht: ["ht-HT", "fr-FR"],
  qu: ["qu-PE", "es-PE"],
  gn: ["gn-PY", "es-AR"],
  ay: ["ay-BO", "es-BO"],
  zh: ["zh-CN", "zh-TW"],
  ar: ["ar-SA", "ar-EG", "ar"],
  aer: ["en-AU", "en-GB", "en-US"],
  aly: ["en-AU", "en-GB", "en-US"],
  aoi: ["en-AU", "en-GB", "en-US"],
  bdy: ["en-AU", "en-GB", "en-US"],
  gup: ["en-AU", "en-GB", "en-US"],
  zku: ["en-AU", "en-GB", "en-US"],
  rop: ["en-AU", "en-GB", "en-US"],
  mwf: ["en-AU", "en-GB", "en-US"],
  pjt: ["en-AU", "en-GB", "en-US"],
  tcs: ["en-AU", "en-GB", "en-US"],
  tiw: ["en-AU", "en-GB", "en-US"],
  wbp: ["en-AU", "en-GB", "en-US"],
  wrh: ["en-AU", "en-GB", "en-US"],
  yol: ["en-AU", "en-GB", "en-US"],
  bli: ["bli-PH", "en-PH", "en-US"],
  "en-au": ["en-AU", "en-GB", "en-US"],
};

export type SpeakOptions = {
  rate?: number;
  volume?: number;
  pitch?: number;
  pronunciationSimple?: string;
  preferLocalVoices?: boolean;
  preferRomanizedWithoutLocalVoice?: boolean;
  onComplete?: () => void;
};

export type SpeakResult = {
  success: boolean;
  spokenText: string;
  voiceName: string | null;
  voiceLang: string | null;
  requestedLang: string;
  usedRegionalFallback: boolean;
  noLocalVoice: boolean;
};

let voicesCache: SpeechSynthesisVoice[] = [];
let voicesReady = false;
let voicesListenerAttached = false;

function refreshVoicesCache(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  voicesCache = window.speechSynthesis.getVoices();
  voicesReady = voicesCache.length > 0;
  return voicesCache;
}

function ensureVoicesChangedListener(): void {
  if (!isSpeechSynthesisSupported() || voicesListenerAttached) return;
  voicesListenerAttached = true;
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    refreshVoicesCache();
  });
}

export function hasVoiceForLanguage(languageCode: string): boolean {
  return selectVoiceForLanguage(languageCode).voice !== null;
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.speechSynthesis.speak === "function"
  );
}

export function getBcp47Lang(languageCode: string): string {
  return BCP47_MAP[languageCode] ?? languageCode;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/_/g, "-");
}

function voiceHaystack(voice: SpeechSynthesisVoice): string {
  return normalize(`${voice.lang} ${voice.name}`);
}

function haystackMatchesPattern(hay: string, pattern: string): boolean {
  const normalizedPattern = normalize(pattern);
  if (normalizedPattern.length <= 3) {
    return (
      hay === normalizedPattern ||
      hay.startsWith(`${normalizedPattern}-`) ||
      hay.includes(`-${normalizedPattern}-`) ||
      hay.endsWith(`-${normalizedPattern}`) ||
      hay.includes(` ${normalizedPattern} `)
    );
  }
  return hay.includes(normalizedPattern);
}

function scoreVoice(voice: SpeechSynthesisVoice, patterns: string[]): number {
  const hay = voiceHaystack(voice);
  let score = 0;

  for (let index = 0; index < patterns.length; index++) {
    const pattern = normalize(patterns[index]);
    if (haystackMatchesPattern(hay, pattern)) {
      score += 100 - index * 10;
    }
  }

  if (voice.default && score > 0) {
    score += 5;
  }

  if (!voice.localService && score > 0) {
    score += 2;
  }

  return score;
}

export function getCachedVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  ensureVoicesChangedListener();
  if (voicesCache.length === 0) {
    refreshVoicesCache();
  }
  return voicesCache;
}

/** Load voices (required on Chrome/Edge before speak). */
export function preloadSpeechVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSynthesisSupported()) {
    return Promise.resolve([]);
  }

  ensureVoicesChangedListener();

  const existing = refreshVoicesCache();
  if (existing.length > 0) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve) => {
    const finish = () => {
      resolve(refreshVoicesCache());
    };

    const handler = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      finish();
    };

    window.speechSynthesis.addEventListener("voiceschanged", handler);
    window.speechSynthesis.getVoices();

    window.setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      finish();
    }, 1500);
  });
}

function languageBaseTag(languageCode: string): string {
  return normalize(getBcp47Lang(languageCode)).split("-")[0];
}

function voiceMatchesLangTag(voiceLang: string, targetLang: string): boolean {
  const voice = normalize(voiceLang);
  const target = normalize(targetLang);
  if (!voice || !target) return false;
  if (voice === target) return true;
  if (voice.startsWith(`${target}-`) || target.startsWith(`${voice}-`)) return true;
  return voice.split("-")[0] === target.split("-")[0];
}

function findVoiceForLangTag(
  voices: SpeechSynthesisVoice[],
  targetLang: string,
): SpeechSynthesisVoice | undefined {
  return voices.find((voice) => voiceMatchesLangTag(voice.lang, targetLang));
}

function isDisallowedVoiceForIndigenousTarget(voice: SpeechSynthesisVoice): boolean {
  const lang = normalize(voice.lang);
  const disallowedPrefixes = ["zh", "ja", "ko", "yue", "cmn"];
  return disallowedPrefixes.some(
    (prefix) => lang === prefix || lang.startsWith(`${prefix}-`),
  );
}

function findAustralianEnglishVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  for (const tag of ["en-AU", "en-GB", "en-US", "en"]) {
    const match = findVoiceForLangTag(voices, tag);
    if (match && !isDisallowedVoiceForIndigenousTarget(match)) {
      return match;
    }
  }

  return voices.find(
    (voice) =>
      !isDisallowedVoiceForIndigenousTarget(voice) &&
      (haystackMatchesPattern(voiceHaystack(voice), "en-au") ||
        haystackMatchesPattern(voiceHaystack(voice), "australia")),
  );
}

function isEnglishLanguageCode(languageCode: string): boolean {
  const base = languageCode.split("::")[0]?.split("-")[0]?.toLowerCase();
  return base === "en";
}

function isDisallowedVoiceForBlaanTarget(voice: SpeechSynthesisVoice): boolean {
  const hay = voiceHaystack(voice);
  const blocked = [
    "fil-ph",
    "fil",
    "tagalog",
    "filipino",
    "ceb",
    "cebuano",
    "bisaya",
    "visayan",
    "ilonggo",
    "hiligaynon",
    "waray",
  ];
  return blocked.some((pattern) => haystackMatchesPattern(hay, pattern));
}

function findPhilippineEnglishVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  for (const tag of ["en-PH", "en-US", "en-GB", "en"]) {
    const match = findVoiceForLangTag(voices, tag);
    if (match && !isDisallowedVoiceForBlaanTarget(match)) {
      return match;
    }
  }

  return voices.find(
    (voice) =>
      !isDisallowedVoiceForBlaanTarget(voice) &&
      haystackMatchesPattern(voiceHaystack(voice), "english"),
  );
}

export function selectVoiceForLanguage(
  languageCode: string,
  options?: { preferLocalVoices?: boolean },
): {
  voice: SpeechSynthesisVoice | null;
  lang: string;
  usedRegionalFallback: boolean;
} {
  const allVoices = getCachedVoices();
  const voices =
    options?.preferLocalVoices === true
      ? allVoices.filter((voice) => voice.localService)
      : allVoices;
  const candidateVoices = voices.length > 0 ? voices : allVoices;

  if (languageCode === BLAAN_LANGUAGE_CODE || languageCode.startsWith(`${BLAAN_LANGUAGE_CODE}::`)) {
    const phVoice = findPhilippineEnglishVoice(voices);
    if (phVoice) {
      return {
        voice: phVoice,
        lang: phVoice.lang || "en-PH",
        usedRegionalFallback: true,
      };
    }

    return {
      voice: null,
      lang: "en-PH",
      usedRegionalFallback: true,
    };
  }

  if (isAustralianIndigenousLanguageCode(languageCode)) {
    const auVoice = findAustralianEnglishVoice(voices);
    if (auVoice) {
      return {
        voice: auVoice,
        lang: auVoice.lang || "en-AU",
        usedRegionalFallback: true,
      };
    }

    return {
      voice: null,
      lang: "en-AU",
      usedRegionalFallback: true,
    };
  }

  const patterns = VOICE_MATCH_PATTERNS[languageCode] ?? [
    normalize(getBcp47Lang(languageCode)),
    languageBaseTag(languageCode),
  ];

  let best: SpeechSynthesisVoice | null = null;
  let bestScore = 0;

  for (const voice of candidateVoices) {
    if (isDisallowedVoiceForIndigenousTarget(voice)) continue;
    if (languageCode === BLAAN_LANGUAGE_CODE && isDisallowedVoiceForBlaanTarget(voice)) {
      continue;
    }
    const score = scoreVoice(voice, patterns);
    if (score > bestScore) {
      bestScore = score;
      best = voice;
    }
  }

  if (best) {
    return {
      voice: best,
      lang: best.lang || getBcp47Lang(languageCode),
      usedRegionalFallback:
        !isEnglishLanguageCode(languageCode) &&
        !voiceMatchesLangTag(best.lang, getBcp47Lang(languageCode)),
    };
  }

  const fallbackTags = [
    ...(VOICE_LANG_FALLBACKS[languageCode] ?? []),
    getBcp47Lang(languageCode),
    languageBaseTag(languageCode),
  ];

  for (const fallbackLang of fallbackTags) {
    const match = findVoiceForLangTag(candidateVoices, fallbackLang);
    if (match && !isDisallowedVoiceForIndigenousTarget(match)) {
      return {
        voice: match,
        lang: match.lang,
        usedRegionalFallback: !voiceMatchesLangTag(match.lang, getBcp47Lang(languageCode)),
      };
    }
  }

  if (languageCode === "en-au") {
    const auVoice = findAustralianEnglishVoice(voices);
    if (auVoice) {
      return {
        voice: auVoice,
        lang: auVoice.lang || "en-AU",
        usedRegionalFallback: !voiceMatchesLangTag(auVoice.lang, "en-AU"),
      };
    }
  }

  const baseMatch = candidateVoices.find(
    (voice) =>
      !isDisallowedVoiceForIndigenousTarget(voice) &&
      voiceMatchesLangTag(voice.lang, languageBaseTag(languageCode)),
  );
  if (baseMatch) {
    return {
      voice: baseMatch,
      lang: baseMatch.lang,
      usedRegionalFallback: true,
    };
  }

  return {
    voice: null,
    lang: getBcp47Lang(languageCode),
    usedRegionalFallback: false,
  };
}

export function getVoiceStatusMessage(
  result: Pick<SpeakResult, "voiceName" | "voiceLang" | "usedRegionalFallback" | "noLocalVoice">,
): string {
  if (result.noLocalVoice) {
    return "No matching speech voice found on this device. Install the target language voice in system settings for better pronunciation.";
  }

  if (result.voiceName) {
    const fallbackNote = result.usedRegionalFallback
      ? " Using closest regional device voice — not native-speaker verified."
      : " Synthetic device voice — not native-speaker verified.";
    return `Speaking with ${result.voiceName} (${result.voiceLang}).${fallbackNote}`;
  }

  return "Synthetic device voice — not native-speaker verified.";
}

export async function speakTextAsync(
  text: string,
  languageCode: string,
  options?: SpeakOptions,
): Promise<SpeakResult> {
  await preloadSpeechVoices();
  return speakText(text, languageCode, options);
}

export function speakText(
  text: string,
  languageCode: string,
  options?: SpeakOptions,
): SpeakResult {
  if (!isSpeechSynthesisSupported()) {
    return {
      success: false,
      spokenText: "",
      voiceName: null,
      voiceLang: null,
      requestedLang: languageCode,
      usedRegionalFallback: false,
      noLocalVoice: true,
    };
  }

  if (!voicesReady) {
    void preloadSpeechVoices();
  }

  const indigenousTarget = isAustralianIndigenousLanguageCode(languageCode);
  const voiceOptions = options?.preferLocalVoices ? { preferLocalVoices: true } : undefined;
  let { voice, lang, usedRegionalFallback } = selectVoiceForLanguage(
    languageCode,
    voiceOptions,
  );

  if (indigenousTarget && !voice) {
    const auFallback = selectVoiceForLanguage("en-au", voiceOptions);
    voice = auFallback.voice;
    lang = auFallback.lang || "en-AU";
    usedRegionalFallback = true;
  }

  const hasVoice = voice !== null;

  const spokenText = resolveSpeechText(text, options?.pronunciationSimple, {
    languageCode,
    preferRomanizedWithoutVoice:
      indigenousTarget || Boolean(options?.preferRomanizedWithoutLocalVoice),
    hasVoice: indigenousTarget
      ? Boolean(options?.pronunciationSimple?.trim())
      : hasVoice,
  });

  if (!spokenText) {
    return {
      success: false,
      spokenText,
      voiceName: null,
      voiceLang: null,
      requestedLang: languageCode,
      usedRegionalFallback: false,
      noLocalVoice: true,
    };
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(spokenText);

  utterance.lang = indigenousTarget ? voice?.lang || "en-AU" : lang;
  utterance.rate = options?.rate ?? (isEnglishLanguageCode(languageCode) ? 1 : 0.92);
  utterance.volume = options?.volume ?? 1;
  utterance.pitch = options?.pitch ?? 1;

  if (voice) {
    utterance.voice = voice;
  }

  const noLocalVoice =
    !isEnglishLanguageCode(languageCode) && !hasVoice && getCachedVoices().length > 0;

  utterance.onend = () => options?.onComplete?.();
  utterance.onerror = () => options?.onComplete?.();

  // Chrome/Edge ignore speak() when called immediately after cancel().
  window.setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 0);

  return {
    success: true,
    spokenText,
    voiceName: voice?.name ?? null,
    voiceLang: voice?.lang ?? lang,
    requestedLang: languageCode,
    usedRegionalFallback,
    noLocalVoice,
  };
}

export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
}

export { cleanTextForSpeech, resolveSpeechText };
