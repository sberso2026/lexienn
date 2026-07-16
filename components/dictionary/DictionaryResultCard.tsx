"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { IconButton } from "@/components/ui/IconButton";
import { useVoicePlayback } from "@/lib/voice/useVoicePlayback";
import { DictionarySourceBadge } from "@/components/ui/DictionarySourceBadge";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { ResultCard } from "@/components/ui/ResultCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { Badge } from "@/components/ui/StatusBadge";
import { encodeLanguageSelection } from "@/lib/languages/languageOptions";
import { cleanTextForSpeech } from "@/lib/audio/speechText";
import { stopVoicePlayback } from "@/lib/voice/audioPlayback";
import { formatEnumLabel } from "@/lib/dictionary/displayUtils";
import { enrichEntryWithProfessionContext } from "@/lib/dictionary/professionEngine";
import {
  isSavedWordDuplicate,
  loadSavedWords,
  saveWordFromDictionaryResult,
} from "@/lib/storage/savedWordsStorage";
import { useCatalogDialectById } from "@/lib/admin/useCatalogDialects";
import {
  getLanguageByCode,
  getUserContextProfile,
} from "@/lib/mock";
import { shouldEnrichWithProfessionContext } from "@/lib/dictionary/dictionarySources";
import { shouldShowInternalDebugUi } from "@/lib/debug/shouldShowInternalDebugUi";
import type { DictionaryDiagnostics } from "@/lib/dictionary/apiSchemas";
import { isEnglishToEnglishQuery } from "@/lib/dictionary/normalizeDictionaryEntry";
import type { DictionaryEntry, DictionaryQuery, DictionaryResolutionSource } from "@/lib/schemas";
import { DataQualityWarnings } from "@/components/ui/DataQualityWarnings";
import { CorrectionForm } from "@/components/corrections/CorrectionForm";

interface DictionaryResultCardProps {
  query: DictionaryQuery;
  entry: DictionaryEntry;
  source: DictionaryResolutionSource;
  diagnostics?: DictionaryDiagnostics;
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">None listed.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-md bg-[var(--background)] px-2.5 py-1 text-sm"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function getTargetLanguageExample(
  entry: DictionaryEntry,
  targetLanguageCode: string,
): string | undefined {
  const targetExamples = entry.examples.filter(
    (example) => example.language_code === targetLanguageCode,
  );

  const preferred =
    targetExamples.find((example) =>
      example.context_label?.toLowerCase().includes("target"),
    ) ?? targetExamples[0];

  return preferred?.text;
}

function getTargetSpeechText(
  entry: DictionaryEntry,
  query: DictionaryQuery,
): { text: string; lang: string; languageSelection: string } {
  const languageSelection =
    query.target_language_selection ??
    encodeLanguageSelection(query.target_language, query.target_dialect);

  if (isEnglishToEnglishQuery(query)) {
    return {
      text: entry.detailed_meaning_en || entry.general_meaning_en,
      lang: query.source_language,
      languageSelection,
    };
  }

  const targetMeaning = cleanTextForSpeech(entry.target_meaning);
  if (targetMeaning.length > 0) {
    return { text: targetMeaning, lang: query.target_language, languageSelection };
  }

  const targetExample = getTargetLanguageExample(entry, query.target_language);
  if (targetExample) {
    return { text: targetExample, lang: query.target_language, languageSelection };
  }

  return { text: entry.input_text, lang: query.source_language, languageSelection };
}

export function DictionaryResultCard({
  query,
  entry,
  source,
  diagnostics,
}: DictionaryResultCardProps) {
  const router = useRouter();
  const enrichedEntry = useMemo(() => {
    if (!shouldEnrichWithProfessionContext(source)) {
      return entry;
    }
    return enrichEntryWithProfessionContext(entry, query);
  }, [entry, query, source]);

  const targetSpeech = useMemo(
    () => getTargetSpeechText(enrichedEntry, query),
    [enrichedEntry, query],
  );

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [copied, setCopied] = useState(false);

  const { isPlaying, play } = useVoicePlayback({
    text: targetSpeech.text,
    language: targetSpeech.lang,
    languageSelection: targetSpeech.languageSelection,
    dialect: query.target_dialect,
    pronunciationSimple: enrichedEntry.pronunciation.simple,
    disabled: source === "unavailable",
  });

  useEffect(() => {
    return () => stopVoicePlayback();
  }, []);

  useEffect(() => {
    setAlreadySaved(
      isSavedWordDuplicate({
        input_text: enrichedEntry.input_text,
        target_language: query.target_language,
        target_dialect: query.target_dialect,
        user_context: query.user_context,
      }, loadSavedWords()),
    );
  }, [enrichedEntry.input_text, query.target_language, query.target_dialect, query.user_context]);

  const sourceLang = getLanguageByCode(query.source_language);
  const targetLang = getLanguageByCode(query.target_language);
  const dialect = useCatalogDialectById(query.target_dialect);
  const contextProfile = getUserContextProfile(query.user_context);
  const contextMeaning = enrichedEntry.profession_meanings.find(
    (meaning) => meaning.context === query.user_context,
  );
  const isDefinitionRequest = isEnglishToEnglishQuery(query);
  const showDevDiagnostics =
    shouldShowInternalDebugUi() && diagnostics !== undefined;
  const unavailableMessage =
    source === "unavailable" ? enrichedEntry.general_meaning_en : undefined;

  const handleSave = useCallback(() => {
    const result = saveWordFromDictionaryResult(enrichedEntry, query);

    if (result.ok) {
      setSaveMessage("Saved to My Dictionary.");
      setAlreadySaved(true);
      return;
    }

    if (result.reason === "duplicate") {
      setSaveMessage("Already saved in My Dictionary.");
      setAlreadySaved(true);
      return;
    }

    setSaveMessage("Could not save. Please try again.");
  }, [enrichedEntry, query]);

  const handleCopy = useCallback(async () => {
    const text = [
      enrichedEntry.input_text,
      enrichedEntry.general_meaning_en,
      !isEnglishToEnglishQuery(query) ? enrichedEntry.target_meaning : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [enrichedEntry, query]);

  return (
    <>
      <div className="space-y-4 pb-4 md:pb-6">
        <header className="card-surface enterprise-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-2xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-3xl">
                {enrichedEntry.input_text}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {formatEnumLabel(enrichedEntry.entry_type)} ·{" "}
                {sourceLang?.name ?? query.source_language}
              </p>
            </div>
            <IconButton
              icon={
                <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12M8 10H5a1 1 0 00-1 1v2a1 1 0 001 1h3l4 3V7L8 10z" />
                </svg>
              }
              label="Play pronunciation"
              disabled={source === "unavailable" || isPlaying}
              active={isPlaying}
              onClick={() => void play("normal")}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <LanguageBadge language={sourceLang?.name ?? query.source_language} />
            <span className="text-[var(--muted)]" aria-hidden="true">→</span>
            <LanguageBadge
              language={targetLang?.name ?? query.target_language}
              dialect={dialect?.variant_label}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <DictionarySourceBadge source={source} />
            <Badge
              label={contextProfile?.label ?? formatEnumLabel(query.user_context)}
              variant="neutral"
            />
            <ConfidenceBadge score={enrichedEntry.confidence.score} />
          </div>
        </header>

        <DataQualityWarnings
          validationStatus={enrichedEntry.validation_status}
          confidenceScore={enrichedEntry.confidence.score}
          confidenceWarning={enrichedEntry.confidence.warning}
          resolutionSource={source}
          isDefinitionRequest={isDefinitionRequest}
          unavailableMessage={unavailableMessage}
        />

        {showDevDiagnostics && (
          <details className="card-surface p-3 text-xs text-[var(--muted)]">
            <summary className="cursor-pointer font-medium text-[var(--foreground)]">
              Development diagnostics
            </summary>
            <ul className="mt-2 space-y-1">
              <li>dictionary_source: {diagnostics.dictionary_source}</li>
              <li>ai_enabled: {String(diagnostics.ai_enabled)}</li>
              <li>provider_configured: {String(diagnostics.provider_configured)}</li>
              <li>model_configured: {String(diagnostics.model_configured)}</li>
              <li>used_ai: {String(diagnostics.used_ai)}</li>
              <li>used_fallback: {String(diagnostics.used_fallback)}</li>
              {diagnostics.fallback_reason && (
                <li>fallback_reason: {diagnostics.fallback_reason}</li>
              )}
            </ul>
          </details>
        )}

        {source !== "unavailable" && (
          <div className="space-y-4">
            <SectionCard title="Meaning" padding="compact">
              <p className="text-sm leading-relaxed sm:text-base">
                {enrichedEntry.general_meaning_en}
              </p>
            </SectionCard>

            {showExplanation && (
              <SectionCard title="Detailed explanation" padding="compact">
                <p className="text-sm leading-relaxed">{enrichedEntry.detailed_meaning_en}</p>
              </SectionCard>
            )}

            {contextMeaning && (
              <SectionCard
                title={`${contextProfile?.label ?? "Professional"} meaning`}
                padding="compact"
              >
                <p className="text-sm leading-relaxed">{contextMeaning.meaning_en}</p>
              </SectionCard>
            )}

            {!isDefinitionRequest && enrichedEntry.target_meaning && (
              <SectionCard
                title={`${targetLang?.name ?? "Local"} translation`}
                padding="compact"
              >
                <p className="text-sm leading-relaxed sm:text-base">
                  {enrichedEntry.target_meaning}
                </p>
              </SectionCard>
            )}

            {enrichedEntry.examples.length > 0 && (
              <SectionCard title="Examples" padding="compact">
                <ul className="space-y-2">
                  {enrichedEntry.examples.map((example, index) => (
                    <li
                      key={`${example.text}-${index}`}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--background)] px-3 py-2 text-sm"
                    >
                      {example.text}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            <SectionCard title="Pronunciation" padding="compact">
              <p className="text-sm font-medium">{enrichedEntry.pronunciation.simple}</p>
            </SectionCard>

            {enrichedEntry.related_terms.length > 0 && (
              <SectionCard title="Related terms" padding="compact">
                <TagList items={enrichedEntry.related_terms} />
              </SectionCard>
            )}

            {enrichedEntry.usage_notes.length > 0 && (
              <ExpandableSection summary="Usage notes">
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {enrichedEntry.usage_notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </ExpandableSection>
            )}

            {enrichedEntry.common_mistakes.length > 0 && (
              <ExpandableSection summary="Common mistakes">
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {enrichedEntry.common_mistakes.map((mistake) => (
                    <li key={mistake}>{mistake}</li>
                  ))}
                </ul>
              </ExpandableSection>
            )}
          </div>
        )}

        {saveMessage && (
          <p className="text-xs text-[var(--muted)]" role="status" aria-live="polite">
            {copied ? "Copied to clipboard." : saveMessage}
          </p>
        )}
        {copied && !saveMessage && (
          <p className="text-xs text-[var(--muted)]" role="status" aria-live="polite">
            Copied to clipboard.
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowCorrectionForm((value) => !value)}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent)]"
          aria-expanded={showCorrectionForm}
        >
          {showCorrectionForm ? "Close correction form" : "Suggest a correction"}
        </button>

        {showCorrectionForm && (
          <ResultCard title="Submit correction">
            <CorrectionForm
              defaults={{
                original_text: enrichedEntry.input_text,
                current_translation: enrichedEntry.target_meaning,
                language: query.target_language,
                dialect: query.target_dialect,
              }}
              onClose={() => setShowCorrectionForm(false)}
            />
          </ResultCard>
        )}
      </div>

      <BottomActionBar ariaLabel="Dictionary result actions">
        <IconButton
          icon={
            <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6v12M8 10H5a1 1 0 00-1 1v2a1 1 0 001 1h3l4 3V7L8 10z" />
            </svg>
          }
          label="Play audio"
          disabled={source === "unavailable" || isPlaying}
          active={isPlaying}
          onClick={() => void play("normal")}
        />
        <IconButton
          icon={
            <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
          label={copied ? "Copied" : "Copy"}
          onClick={() => void handleCopy()}
        />
        <IconButton
          icon={
            <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          label="Save"
          disabled={alreadySaved}
          onClick={handleSave}
        />
        <IconButton
          icon={
            <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M9.1 9a3 3 0 115.8 1c0 2-2.9 2-2.9 4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          }
          label="Explain"
          active={showExplanation}
          onClick={() => setShowExplanation((value) => !value)}
        />
        <IconButton
          icon={
            <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          }
          label="Add to Library"
          onClick={() => {
            if (alreadySaved) {
              router.push("/library");
            } else {
              handleSave();
            }
          }}
        />
      </BottomActionBar>
    </>
  );
}
