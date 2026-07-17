import {
  generateDictionaryEntryWithAiDetailed,
  isAiDictionaryConfigured,
  aiFailureToFallbackReason,
  aiFailureToErrorCode,
} from "@/lib/ai/aiDictionaryService";
import { getAiConfig, getAiStatus } from "@/lib/ai/config";
import { isServerDeveloperDiagnosticsEnabled } from "@/lib/debug/serverDiagnostics";
import type { DictionaryDiagnostics, DictionaryResolutionStep } from "@/lib/dictionary/apiSchemas";
import { resolveCommonSeedDictionaryEntry } from "@/lib/dictionary/commonSeedDictionary";
import { resolveCuratedDictionaryEntry } from "@/lib/dictionary/curatedDictionary";
import { resolveGlossaryEntry } from "@/lib/dictionary/engineeringGlossary";
import {
  applyQueryToEntry,
  buildUnavailableEntry,
} from "@/lib/dictionary/normalizeDictionaryEntry";
import { resolveMockSeedDictionaryEntry } from "@/lib/dictionary/resolveMockSeedEntry";
import { normalizeLookupText } from "@/lib/text/normalizeLookupText";
import type { DictionaryEntry, DictionaryQuery, DictionaryResolutionSource } from "@/lib/schemas";

export type DictionaryResolutionResult = {
  entry: DictionaryEntry;
  source: DictionaryResolutionSource;
  diagnostics: DictionaryDiagnostics;
};

const SKIP_ENRICH_SOURCES: DictionaryResolutionSource[] = [
  "curated_dictionary",
  "domain_glossary",
  "seed_dictionary",
  "external_dictionary",
  "unavailable",
];

export function shouldEnrichWithProfessionContext(
  source: DictionaryResolutionSource,
): boolean {
  return !SKIP_ENRICH_SOURCES.includes(source);
}

function buildDiagnostics(
  source: DictionaryResolutionSource,
  options: {
    used_ai: boolean;
    used_fallback: boolean;
    fallback_reason?: string;
    lookupKey: string;
    resolutionSteps: DictionaryResolutionStep[];
    aiConfigured: boolean;
    aiErrorCode?: string | null;
  },
): DictionaryDiagnostics {
  const status = getAiStatus();
  return {
    dictionary_source: source,
    ai_enabled: status.ai_enabled,
    provider_configured: status.provider_configured,
    model_configured: status.model_configured,
    used_ai: options.used_ai,
    used_fallback: options.used_fallback,
    fallback_reason: options.fallback_reason,
    lookupKey: options.lookupKey,
    resolutionSteps: options.resolutionSteps,
    aiConfigured: options.aiConfigured,
    aiErrorCode: options.aiErrorCode ?? null,
  };
}

function logDiagnostics(diagnostics: DictionaryDiagnostics): void {
  console.info("[dictionary.resolve]", {
    source: diagnostics.dictionary_source,
    ai_enabled: diagnostics.ai_enabled,
    used_ai: diagnostics.used_ai,
    ...(diagnostics.fallback_reason ? { fallback_reason: diagnostics.fallback_reason } : {}),
  });
}

function finish(
  entry: DictionaryEntry,
  source: DictionaryResolutionSource,
  diagnostics: DictionaryDiagnostics,
): DictionaryResolutionResult {
  logDiagnostics(diagnostics);
  return { entry, source, diagnostics };
}

/**
 * Production dictionary resolution order:
 * 1. Curated / verified dictionary seed
 * 2. Domain glossary
 * 3. Common seed dictionary
 * 4. Legacy mock seed dictionary (exact match only)
 * 5. AI-generated definition (when configured)
 * 6. Unavailable safe response
 */
export async function resolveDictionaryFromSources(
  query: DictionaryQuery,
): Promise<DictionaryResolutionResult> {
  const lookupKey = normalizeLookupText(query.input_text);
  const resolutionSteps: DictionaryResolutionStep[] = [];
  const aiConfigured = isAiDictionaryConfigured();

  const curated = resolveCuratedDictionaryEntry(query);
  resolutionSteps.push({ source: "curated_dictionary", hit: Boolean(curated) });
  if (curated) {
    return finish(
      curated,
      "curated_dictionary",
      buildDiagnostics("curated_dictionary", {
        used_ai: false,
        used_fallback: false,
        lookupKey,
        resolutionSteps,
        aiConfigured,
        aiErrorCode: null,
      }),
    );
  }

  const glossary = resolveGlossaryEntry(query);
  resolutionSteps.push({ source: "domain_glossary", hit: Boolean(glossary) });
  if (glossary) {
    return finish(
      glossary,
      "domain_glossary",
      buildDiagnostics("domain_glossary", {
        used_ai: false,
        used_fallback: false,
        lookupKey,
        resolutionSteps,
        aiConfigured,
        aiErrorCode: null,
      }),
    );
  }

  const commonSeed = resolveCommonSeedDictionaryEntry(query);
  resolutionSteps.push({ source: "seed_dictionary", hit: Boolean(commonSeed) });
  if (commonSeed) {
    return finish(
      commonSeed,
      "seed_dictionary",
      buildDiagnostics("seed_dictionary", {
        used_ai: false,
        used_fallback: false,
        lookupKey,
        resolutionSteps,
        aiConfigured,
        aiErrorCode: null,
      }),
    );
  }

  const mockSeed = resolveMockSeedDictionaryEntry(query);
  resolutionSteps.push({ source: "external_dictionary", hit: Boolean(mockSeed) });
  if (mockSeed) {
    return finish(
      mockSeed,
      "external_dictionary",
      buildDiagnostics("external_dictionary", {
        used_ai: false,
        used_fallback: false,
        lookupKey,
        resolutionSteps,
        aiConfigured,
        aiErrorCode: null,
      }),
    );
  }

  if (aiConfigured) {
    resolutionSteps.push({ source: "ai_generated", called: true });
    const aiResult = await generateDictionaryEntryWithAiDetailed(query);
    if (aiResult.ok) {
      const entry = applyQueryToEntry(
        {
          ...aiResult.entry,
          validation_status: aiResult.entry.validation_status ?? "ai_generated_unverified",
          is_mock_data: false,
          mock_data_notice: undefined,
        },
        query,
      );
      return finish(
        entry,
        "ai_generated",
        buildDiagnostics("ai_generated", {
          used_ai: true,
          used_fallback: false,
          lookupKey,
          resolutionSteps,
          aiConfigured,
          aiErrorCode: null,
        }),
      );
    }

    const fallbackReason = aiFailureToFallbackReason(aiResult.reason);
    const aiErrorCode = aiResult.errorCode;
    return finish(
      buildUnavailableEntry(query, fallbackReason),
      "unavailable",
      buildDiagnostics("unavailable", {
        used_ai: true,
        used_fallback: true,
        fallback_reason: isServerDeveloperDiagnosticsEnabled()
          ? `${fallbackReason} (${aiErrorCode})`
          : fallbackReason,
        lookupKey,
        resolutionSteps,
        aiConfigured,
        aiErrorCode,
      }),
    );
  }

  resolutionSteps.push({ source: "ai_generated", called: false });

  const config = getAiConfig();
  let fallbackReason: string;
  let errorCode: string;
  if (!config.enabled) {
    fallbackReason = "AI_ENABLED is false";
    errorCode = aiFailureToErrorCode("not_configured");
  } else if (!config.providerConfigured) {
    fallbackReason = "AI provider or API key is not configured";
    errorCode = aiFailureToErrorCode("missing_api_key");
  } else if (!config.modelConfigured) {
    fallbackReason = "AI_MODEL is not configured";
    errorCode = aiFailureToErrorCode("model_error");
  } else {
    fallbackReason = "No local dictionary entry and AI is not configured";
    errorCode = aiFailureToErrorCode("unknown_provider_error");
  }

  return finish(
    buildUnavailableEntry(query, fallbackReason),
    "unavailable",
    buildDiagnostics("unavailable", {
      used_ai: false,
      used_fallback: true,
      fallback_reason: isServerDeveloperDiagnosticsEnabled()
        ? `${fallbackReason} (${errorCode})`
        : fallbackReason,
      lookupKey,
      resolutionSteps,
      aiConfigured,
      aiErrorCode: errorCode,
    }),
  );
}

export const DICTIONARY_SOURCE_LABELS: Record<DictionaryResolutionSource, string> = {
  curated_dictionary: "Curated dictionary",
  domain_glossary: "Domain glossary",
  seed_dictionary: "Dictionary",
  external_dictionary: "Dictionary",
  ai_generated: "AI-generated, unverified",
  unavailable: "Unavailable",
};
