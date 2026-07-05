import {
  generateDictionaryEntryWithAi,
  isAiDictionaryConfigured,
} from "@/lib/ai/aiDictionaryService";
import { getAiConfig, getAiConfigDiagnostic, getAiStatus } from "@/lib/ai/config";
import { shouldShowInternalDebugUi } from "@/lib/debug/shouldShowInternalDebugUi";
import type { DictionaryDiagnostics } from "@/lib/dictionary/apiSchemas";
import { resolveCuratedDictionaryEntry } from "@/lib/dictionary/curatedDictionary";
import { resolveGlossaryEntry } from "@/lib/dictionary/engineeringGlossary";
import {
  applyQueryToEntry,
  buildUnavailableEntry,
} from "@/lib/dictionary/normalizeDictionaryEntry";
import { resolveMockSeedDictionaryEntry } from "@/lib/dictionary/resolveMockSeedEntry";
import type { DictionaryEntry, DictionaryQuery, DictionaryResolutionSource } from "@/lib/schemas";

export type DictionaryResolutionResult = {
  entry: DictionaryEntry;
  source: DictionaryResolutionSource;
  diagnostics: DictionaryDiagnostics;
};

const SKIP_ENRICH_SOURCES: DictionaryResolutionSource[] = [
  "curated_dictionary",
  "domain_glossary",
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
  };
}

function logDiagnostics(diagnostics: DictionaryDiagnostics): void {
  if (!shouldShowInternalDebugUi()) return;
  console.info("[dictionary]", diagnostics);
  const configNote = getAiConfigDiagnostic();
  if (configNote) {
    console.info("[dictionary]", configNote);
  }
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
 * 3. Seed-data dictionary (exact match only)
 * 4. AI-generated definition (when configured)
 * 5. Unavailable safe response
 */
export async function resolveDictionaryFromSources(
  query: DictionaryQuery,
): Promise<DictionaryResolutionResult> {
  const curated = resolveCuratedDictionaryEntry(query);
  if (curated) {
    return finish(
      curated,
      "curated_dictionary",
      buildDiagnostics("curated_dictionary", {
        used_ai: false,
        used_fallback: false,
      }),
    );
  }

  const glossary = resolveGlossaryEntry(query);
  if (glossary) {
    return finish(
      glossary,
      "domain_glossary",
      buildDiagnostics("domain_glossary", {
        used_ai: false,
        used_fallback: false,
      }),
    );
  }

  const mockSeed = resolveMockSeedDictionaryEntry(query);
  if (mockSeed) {
    return finish(
      mockSeed,
      "external_dictionary",
      buildDiagnostics("external_dictionary", {
        used_ai: false,
        used_fallback: false,
      }),
    );
  }

  const aiConfigured = isAiDictionaryConfigured();
  if (aiConfigured) {
    const aiEntry = await generateDictionaryEntryWithAi(query);
    if (aiEntry) {
      const entry = applyQueryToEntry(
        {
          ...aiEntry,
          validation_status: aiEntry.validation_status ?? "ai_generated_unverified",
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
        }),
      );
    }
  }

  const config = getAiConfig();
  let fallbackReason: string;
  if (!config.enabled) {
    fallbackReason = "AI_ENABLED is false";
  } else if (!config.providerConfigured) {
    fallbackReason = "AI provider or API key is not configured";
  } else if (!config.modelConfigured) {
    fallbackReason = "AI_MODEL is not configured";
  } else if (aiConfigured) {
    fallbackReason = "AI generation did not return valid JSON after retry";
  } else {
    fallbackReason = "No local dictionary entry and AI is not configured";
  }

  return finish(
    buildUnavailableEntry(query, fallbackReason),
    "unavailable",
    buildDiagnostics("unavailable", {
      used_ai: aiConfigured,
      used_fallback: true,
      fallback_reason: fallbackReason,
    }),
  );
}

export const DICTIONARY_SOURCE_LABELS: Record<DictionaryResolutionSource, string> = {
  curated_dictionary: "Curated dictionary",
  domain_glossary: "Domain glossary",
  external_dictionary: "Seed dictionary",
  ai_generated: "AI-generated, unverified",
  unavailable: "Unavailable",
};
