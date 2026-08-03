import { getAiConfig, getAiTimeoutMs } from "@/lib/ai/config";
import { requestOpenAiChatCompletionDetailed } from "@/lib/ai/openAiClient";
import { extractJsonFromAiText } from "@/lib/ai/parseAiJson";

export type AiLanguageIdentification = {
  primaryCode: string | null;
  secondaryCode: string | null;
  confidence: number;
  raw?: string;
};

const ALLOWED = new Set([
  "en",
  "tl",
  "fil",
  "ceb",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "ja",
  "zh",
  "ko",
  "ar",
  "hi",
  "ru",
  "th",
  "vi",
  "id",
  "ms",
  "mi",
]);

function normalizeCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const base = value.trim().toLowerCase().split(/[-_]/)[0] ?? "";
  if (!base) return null;
  if (base === "fil" || base === "tgl") return "tl";
  if (base === "eng") return "en";
  if (base === "jpn") return "ja";
  if (base === "kor") return "ko";
  if (base === "zho" || base === "cmn") return "zh";
  if (base === "ara") return "ar";
  if (base === "spa") return "es";
  if (base === "fra") return "fr";
  if (base === "deu") return "de";
  if (base === "ita") return "it";
  if (base === "por") return "pt";
  if (!ALLOWED.has(base)) return null;
  return base === "fil" ? "tl" : base;
}

/**
 * Stage 2 — AI language identification for ambiguous transcripts only.
 */
export async function identifyLanguageWithAi(
  transcript: string,
): Promise<AiLanguageIdentification> {
  const config = getAiConfig();
  if (!config.isConfigured) {
    return { primaryCode: null, secondaryCode: null, confidence: 0 };
  }

  const result = await requestOpenAiChatCompletionDetailed(
    {
      model: config.model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You identify the language of short user utterances for a translator app. " +
            "Respond with JSON only: {\"primary\":\"<iso6391 or ceb>\",\"secondary\":null|\"code\",\"confidence\":0-1}. " +
            "Use tl for Filipino/Tagalog, ceb for Cebuano/Bisaya. " +
            "If mixed, set primary to the dominant language and secondary to the other. " +
            "Never invent languages. If unknown, primary null and confidence 0.",
        },
        {
          role: "user",
          content: transcript.slice(0, 500),
        },
      ],
    },
    { timeoutMs: Math.min(getAiTimeoutMs(), 8000) },
  );

  if (!result.ok || !result.content) {
    return { primaryCode: null, secondaryCode: null, confidence: 0 };
  }

  let parsed: {
    primary?: unknown;
    secondary?: unknown;
    confidence?: unknown;
  };
  try {
    parsed = extractJsonFromAiText(result.content) as {
      primary?: unknown;
      secondary?: unknown;
      confidence?: unknown;
    };
  } catch {
    return {
      primaryCode: null,
      secondaryCode: null,
      confidence: 0,
      raw: result.content.slice(0, 120),
    };
  }

  const confidence =
    typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.7;

  return {
    primaryCode: normalizeCode(parsed.primary),
    secondaryCode: normalizeCode(parsed.secondary),
    confidence,
    raw: result.content.slice(0, 120),
  };
}
