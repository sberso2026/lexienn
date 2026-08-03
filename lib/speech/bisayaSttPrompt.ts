import {
  BISAYA_BASE_PROMPT,
  BISAYA_STRONG_RETRY_PROMPT,
  BISAYA_STT_VOCABULARY,
  isCebuanoLanguageHint,
} from "@/lib/speech/bisayaStt";

const MAX_HINT_CHARS = 480;
const MAX_HINT_TERMS = 24;

function sanitizeHintTerm(term: string): string {
  return term.replace(/\s+/g, " ").trim().slice(0, 80);
}

/**
 * Build Whisper / gpt-4o-transcribe prompt for Cebuano.
 * Bounded: vocabulary + recent conversation + personal glossary hints.
 */
export function buildBisayaSttPrompt(options: {
  extraHints?: string[];
  strongRetry?: boolean;
}): string {
  const base = options.strongRetry ? BISAYA_STRONG_RETRY_PROMPT : BISAYA_BASE_PROMPT;
  const hints = (options.extraHints ?? [])
    .map(sanitizeHintTerm)
    .filter(Boolean)
    .slice(0, MAX_HINT_TERMS);

  if (hints.length === 0) return base.slice(0, MAX_HINT_CHARS);

  const hintBlock = ` Recent / learned terms: ${hints.join(", ")}.`;
  return `${base}${hintBlock}`.slice(0, MAX_HINT_CHARS);
}

export function buildGenericSttPrompt(
  inputTarget: string,
  userContext: string,
): string {
  return `Transcribe spoken ${inputTarget} input for ${userContext} context.`;
}

export function collectBoundedSttHints(parts: {
  recentConversationTerms?: string[];
  personalGlossary?: string[];
  taughtBisayaPhrases?: string[];
}): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  const push = (value: string) => {
    const cleaned = sanitizeHintTerm(value);
    if (!cleaned) return;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(cleaned);
  };

  for (const term of parts.taughtBisayaPhrases ?? []) push(term);
  for (const term of parts.personalGlossary ?? []) push(term);
  for (const term of parts.recentConversationTerms ?? []) push(term);
  for (const term of BISAYA_STT_VOCABULARY) push(term);

  return merged.slice(0, MAX_HINT_TERMS);
}

export function shouldUseBisayaSttPrompt(languageHint: string): boolean {
  return isCebuanoLanguageHint(languageHint);
}
