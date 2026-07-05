"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { IconButton } from "@/components/ui/IconButton";
import { StatusChip } from "@/components/ui/StatusChip";
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
import { ValidationStatusBadge } from "@/components/ui/ValidationStatusBadge";
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

  const { isPlaying, audioType, play } = useVoicePlayback({
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

  return (
    <>
      <div className="space-y-4 pb-28 md:pb-6">
        <header className="card-surface p-4 sm:p-5">
          <p className="text-2xl font-bold leading-tight tracking-tight text-[var(--foreground)] sm:text-3xl">
            {enrichedEntry.input_text}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <LanguageBadge
              language={sourceLang?.name ?? query.source_language}
            />
            <span className="text-[var(--muted)]" aria-hidden="true">
              →
            </span>
            <LanguageBadge
              language={targetLang?.name ?? query.target_language}
              dialect={dialect?.variant_label}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge label={formatEnumLabel(enrichedEntry.entry_type)} variant="accent" />
            <DictionarySourceBadge source={source} />
            <ValidationStatusBadge status={enrichedEntry.validation_status} />
            <ConfidenceBadge score={enrichedEntry.confidence.score} />
            {audioType && <StatusChip label="Audio" variant="info" />}
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {contextProfile?.label ?? formatEnumLabel(query.user_context)} ·{" "}
            {formatEnumLabel(query.explanation_level)} ·{" "}
            {formatEnumLabel(query.output_mode)}
          </p>
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

            <ExpandableSection summary="Detailed meaning">
              <p className="text-sm leading-relaxed">{enrichedEntry.detailed_meaning_en}</p>
            </ExpandableSection>

            {(contextMeaning || query.user_context !== "general") && (
              <ExpandableSection
                summary={`${contextProfile?.label ?? "Profession"} meaning`}
              >
                {contextMeaning ? (
                  <p className="text-sm leading-relaxed">{contextMeaning.meaning_en}</p>
                ) : (
                  <p className="text-sm text-[var(--muted)]">No profession-specific meaning.</p>
                )}
              </ExpandableSection>
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
              <ExpandableSection summary="Examples">
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
              </ExpandableSection>
            )}

            <SectionCard title="Pronunciation" padding="compact">
              <p className="text-sm font-medium">{enrichedEntry.pronunciation.simple}</p>
            </SectionCard>

            {enrichedEntry.related_terms.length > 0 && (
              <SectionCard title="Related" padding="compact">
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
          <p className="text-xs text-[var(--muted)]" role="status">
            {saveMessage}
          </p>
        )}

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
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
          label="Correct"
          onClick={() => setShowCorrectionForm((value) => !value)}
        />
        <Link href="/dictionary">
          <IconButton
            icon={
              <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
            }
            label="New lookup"
          />
        </Link>
      </BottomActionBar>
    </>
  );
}
