import {
  LANGUAGE_PHRASE_DICTIONARIES,
  LANGUAGE_VOCABULARY,
  type DetectionLanguageCode,
} from "@/lib/languages/languageDetectionPhrases";

/** Skip AI when local confidence reaches this threshold. */
export const LOCAL_SKIP_AI_CONFIDENCE = 0.95;

export type LocalLanguageDetection = {
  primaryCode: DetectionLanguageCode | null;
  secondaryCode: DetectionLanguageCode | null;
  confidence: number;
  scores: Partial<Record<DetectionLanguageCode, number>>;
  reason: string;
};

function normalizeForDetection(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[?!.,:;…]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(normalized: string): string[] {
  return normalized
    .split(/[\s/\\|+]+/)
    .map((token) => token.replace(/^[^a-z0-9\u00c0-\u024f\u0600-\u06ff\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af'-]+|[^a-z0-9\u00c0-\u024f\u0600-\u06ff\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af'-]+$/gi, ""))
    .filter(Boolean);
}

function scriptSignals(raw: string): Partial<Record<DetectionLanguageCode, number>> {
  const scores: Partial<Record<DetectionLanguageCode, number>> = {};
  const arabic = (raw.match(/[\u0600-\u06FF]/g) ?? []).length;
  const cjk = (raw.match(/[\u4E00-\u9FFF]/g) ?? []).length;
  const hiraganaKatakana = (raw.match(/[\u3040-\u30FF]/g) ?? []).length;
  const hangul = (raw.match(/[\uAC00-\uD7AF]/g) ?? []).length;

  if (arabic > 0) scores.ar = 12 + arabic;
  if (hangul > 0) scores.ko = 12 + hangul;
  if (hiraganaKatakana > 0) scores.ja = 14 + hiraganaKatakana;
  if (cjk > 0 && hiraganaKatakana === 0) scores.zh = 12 + cjk;
  if (cjk > 0 && hiraganaKatakana > 0) {
    scores.ja = (scores.ja ?? 0) + cjk;
  }
  return scores;
}

function phraseHits(normalized: string): Partial<Record<DetectionLanguageCode, number>> {
  const scores: Partial<Record<DetectionLanguageCode, number>> = {};
  const padded = ` ${normalized} `;
  for (const [code, phrases] of Object.entries(LANGUAGE_PHRASE_DICTIONARIES) as Array<
    [DetectionLanguageCode, string[]]
  >) {
    let hit = 0;
    for (const phrase of phrases) {
      if (!phrase) continue;
      if (normalized === phrase || padded.includes(` ${phrase} `) || normalized.includes(phrase)) {
        // Longer phrases are stronger evidence.
        hit += Math.max(3, Math.min(8, phrase.split(/\s+/).length + 2));
      }
    }
    if (hit > 0) scores[code] = hit;
  }
  return scores;
}

function vocabularyHits(
  tokens: string[],
): Partial<Record<DetectionLanguageCode, number>> {
  const scores: Partial<Record<DetectionLanguageCode, number>> = {};
  const set = new Set(tokens);
  for (const [code, words] of Object.entries(LANGUAGE_VOCABULARY) as Array<
    [DetectionLanguageCode, string[]]
  >) {
    let hit = 0;
    for (const word of words) {
      if (set.has(word)) {
        // Cebuano markers are highly distinctive vs Filipino.
        hit += code === "ceb" ? 2.5 : 1;
      }
    }
    if (hit > 0) scores[code] = hit;
  }
  return scores;
}

function mergeScores(
  ...parts: Array<Partial<Record<DetectionLanguageCode, number>>>
): Partial<Record<DetectionLanguageCode, number>> {
  const out: Partial<Record<DetectionLanguageCode, number>> = {};
  for (const part of parts) {
    for (const [code, value] of Object.entries(part) as Array<
      [DetectionLanguageCode, number]
    >) {
      out[code] = (out[code] ?? 0) + value;
    }
  }
  return out;
}

function rankScores(
  scores: Partial<Record<DetectionLanguageCode, number>>,
): Array<{ code: DetectionLanguageCode; score: number }> {
  return (Object.entries(scores) as Array<[DetectionLanguageCode, number]>)
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([code, score]) => ({ code, score }));
}

function confidenceFromScores(
  best: number,
  second: number,
  reason: string,
): number {
  if (reason.startsWith("script_") || reason.startsWith("exact_phrase")) {
    return 0.99;
  }
  if (reason.startsWith("phrase_")) {
    // Mixed-language utterances can have a strong runner-up; still auto-apply primary.
    if (best >= 3) return second >= best * 0.75 ? 0.96 : best >= 6 ? 0.98 : 0.96;
  }
  if (best >= 8 && best >= second * 1.6) return 0.97;
  if (best >= 5 && best > second) return 0.95;
  if (best >= 3 && best > second) return 0.88;
  if (best > second) return 0.78;
  // Tied high phrase/vocab scores → still confident primary (insertion order).
  if (best >= 4 && best === second) return 0.95;
  if (best > 0 && best === second) return 0.55;
  return 0;
}

/**
 * Stage 1 — fast local language identification.
 * Uses Unicode script, phrase dictionaries, vocabulary, and simple score ranking.
 */
export function detectLanguageLocal(transcript: string): LocalLanguageDetection {
  const raw = transcript.trim();
  if (!raw) {
    return {
      primaryCode: null,
      secondaryCode: null,
      confidence: 0,
      scores: {},
      reason: "empty",
    };
  }

  const normalized = normalizeForDetection(raw);
  const tokens = tokenize(normalized);
  const scripts = scriptSignals(raw);
  const phrases = phraseHits(normalized);
  const vocab = vocabularyHits(tokens);
  const scores = mergeScores(scripts, phrases, vocab);

  // Exact whole-string phrase / vocab short utterances (e.g. "Bonjour.", "Amping.")
  for (const [code, phraseList] of Object.entries(LANGUAGE_PHRASE_DICTIONARIES) as Array<
    [DetectionLanguageCode, string[]]
  >) {
    if (phraseList.includes(normalized)) {
      scores[code] = (scores[code] ?? 0) + 20;
    }
  }
  for (const [code, words] of Object.entries(LANGUAGE_VOCABULARY) as Array<
    [DetectionLanguageCode, string[]]
  >) {
    if (tokens.length === 1 && words.includes(tokens[0]!)) {
      scores[code] = (scores[code] ?? 0) + (code === "ceb" ? 18 : 14);
    }
  }

  // Disambiguate Filipino vs Cebuano when both fire on shared greetings.
  if ((scores.ceb ?? 0) > 0 && (scores.tl ?? 0) > 0) {
    const cebDistinct = LANGUAGE_VOCABULARY.ceb.filter((w) =>
      tokens.includes(w),
    ).length;
    const tlDistinct = LANGUAGE_VOCABULARY.tl.filter((w) => tokens.includes(w)).length;
    if (cebDistinct > 0 && cebDistinct >= tlDistinct) {
      scores.ceb = (scores.ceb ?? 0) + 4;
      scores.tl = Math.max(0, (scores.tl ?? 0) - 2);
    } else if (tlDistinct > cebDistinct) {
      scores.tl = (scores.tl ?? 0) + 3;
    }
  }

  const ranked = rankScores(scores);
  if (ranked.length === 0) {
    // Weak Latin prior only for multi-token English-looking text without rival markers.
    if (/^[a-z0-9\s'"-]+$/i.test(normalized) && tokens.length >= 3) {
      return {
        primaryCode: "en",
        secondaryCode: null,
        confidence: 0.55,
        scores: { en: 1 },
        reason: "latin_prior_weak",
      };
    }
    return {
      primaryCode: null,
      secondaryCode: null,
      confidence: 0,
      scores: {},
      reason: "no_signal",
    };
  }

  const best = ranked[0]!;
  const second = ranked[1];
  let reason = "scored";
  if (Object.keys(scripts).length > 0 && (scripts[best.code] ?? 0) > 0) {
    reason = `script_${best.code}`;
  } else if ((phrases[best.code] ?? 0) >= 3) {
    reason =
      normalized ===
        LANGUAGE_PHRASE_DICTIONARIES[best.code].find((p) => p === normalized)
        ? `exact_phrase_${best.code}`
        : `phrase_${best.code}`;
  } else if (tokens.length === 1) {
    reason = `exact_phrase_${best.code}`;
  }

  const confidence = confidenceFromScores(best.score, second?.score ?? 0, reason);

  let secondaryCode: DetectionLanguageCode | null = null;
  if (
    second &&
    second.score >= Math.max(2.5, best.score * 0.35) &&
    second.code !== best.code
  ) {
    secondaryCode = second.code;
  }

  return {
    primaryCode: best.code,
    secondaryCode,
    confidence,
    scores,
    reason,
  };
}

/** Sync helper used by STT fallbacks and older call sites. */
export function inferSpokenLanguageFromTranscript(transcript: string): {
  code: string | null;
  confidence: number;
  secondaryCode?: string | null;
} {
  const local = detectLanguageLocal(transcript);
  return {
    code: local.primaryCode,
    confidence: local.confidence,
    secondaryCode: local.secondaryCode,
  };
}
