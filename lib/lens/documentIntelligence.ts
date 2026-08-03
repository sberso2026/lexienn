import type { LensDocumentActionId } from "@/lib/lens/lensTypes";

const DATE_RE =
  /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{2,4})\b/gi;

const WARNING_RE =
  /\b(warning|danger|caution|hazard|poison|toxic|flammable|do not|never|keep out|emergency|urgent|allergy|side effect|contraindication)\b/gi;

const ACTION_RE =
  /\b(take|apply|call|press|turn|stop|start|open|close|submit|return|arrive|depart|check|wear|wash|store|keep|avoid|contact)\b[^.!?\n]{0,80}/gi;

const DIFFICULT_WORD_RE = /\b[A-Za-z][A-Za-z-]{8,}\b/g;

export type DocumentIntelligenceResult = {
  action: LensDocumentActionId;
  title: string;
  body: string;
  isAiExplanation: boolean;
  items?: string[];
};

/** Local deterministic extractors (no network). AI explanation actions return prompts for UI. */
export function runLocalDocumentIntelligence(
  action: LensDocumentActionId,
  text: string,
): DocumentIntelligenceResult {
  const source = text.trim();

  if (action === "preserve_original") {
    return {
      action,
      title: "Original text (OCR)",
      body: source || "No OCR text yet.",
      isAiExplanation: false,
    };
  }

  if (action === "extract_dates") {
    const dates = uniqueMatches(source.match(DATE_RE));
    return {
      action,
      title: "Extracted dates",
      body: dates.length ? dates.join("\n") : "No clear dates found in the OCR text.",
      isAiExplanation: false,
      items: dates,
    };
  }

  if (action === "extract_warnings") {
    const lines = source
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => WARNING_RE.test(line));
    WARNING_RE.lastIndex = 0;
    return {
      action,
      title: "Extracted warnings",
      body: lines.length
        ? lines.join("\n")
        : "No explicit warning phrases found. Review the original text carefully.",
      isAiExplanation: false,
      items: lines,
    };
  }

  if (action === "extract_actions") {
    const actions = uniqueMatches(source.match(ACTION_RE));
    return {
      action,
      title: "Extracted actions",
      body: actions.length ? actions.join("\n") : "No clear action phrases detected.",
      isAiExplanation: false,
      items: actions,
    };
  }

  if (action === "define_difficult") {
    const words = uniqueMatches(source.match(DIFFICULT_WORD_RE))
      .filter((word) => !/^(however|therefore|according|including|important)$/i.test(word))
      .slice(0, 12);
    return {
      action,
      title: "Difficult words to define",
      body: words.length
        ? "Tap a word below or in the OCR text to open Tap to Define."
        : "No long difficult words detected.",
      isAiExplanation: false,
      items: words,
    };
  }

  if (action === "summarize") {
    const sentences = source
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const summary = sentences.slice(0, 2).join(" ");
    return {
      action,
      title: "Quick summary (from OCR text)",
      body: summary || "Not enough text to summarize.",
      isAiExplanation: true,
    };
  }

  if (action === "explain_simply") {
    return {
      action,
      title: "Explain simply",
      body:
        "Use Translate all for a full translation, then review the original OCR text beside it. AI explanations are not certified advice.",
      isAiExplanation: true,
    };
  }

  return {
    action,
    title: "Translate all",
    body: "Run Translate on the full OCR text.",
    isAiExplanation: false,
  };
}

function uniqueMatches(matches: RegExpMatchArray | null): string[] {
  if (!matches) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of matches) {
    const key = item.trim();
    if (!key || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    out.push(key);
  }
  return out;
}

/** Preserve numbers, units, prices, and dates when validating OCR retention. */
export function extractPreservedNumericTokens(text: string): string[] {
  const matches = text.match(
    /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d+(?:[.,]\d+)?(?:\s?(?:%|mg|kg|g|ml|l|km|cm|mm|m|°C|°F|USD|EUR|PHP|AUD|\$))?|\$(?:\d+(?:[.,]\d+)?)/gi,
  );
  return uniqueMatches(matches);
}
