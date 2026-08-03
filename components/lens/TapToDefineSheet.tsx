"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { InfoSheet } from "@/components/ui/InfoSheet";
import { LoadingState } from "@/components/ui/LoadingState";
import { generateDictionaryEntryViaApi } from "@/lib/dictionary/dictionaryApiClient";
import type { DictionaryEntry, DictionaryQuery, UserContext } from "@/lib/schemas";
import { saveWordFromDictionaryResult } from "@/lib/storage/savedWordsStorage";

type TapToDefineSheetProps = {
  open: boolean;
  word: string;
  sourceLanguage: string;
  targetLanguage: string;
  userContext: UserContext;
  onClose: () => void;
};

export function TapToDefineSheet({
  open,
  word,
  sourceLanguage,
  targetLanguage,
  userContext,
  onClose,
}: TapToDefineSheetProps) {
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [query, setQuery] = useState<DictionaryQuery | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !word.trim()) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEntry(null);
    setQuery(null);
    setSaveMessage(null);

    const lookup: DictionaryQuery = {
      input_text: word.trim(),
      source_language: sourceLanguage || "en",
      target_language: targetLanguage || "en",
      user_context: userContext,
      explanation_level: "simple",
      output_mode: "explain_and_translate",
    };

    void generateDictionaryEntryViaApi(lookup)
      .then(({ response }) => {
        if (cancelled) return;
        if (response.source === "unavailable") {
          setError("Definition unavailable for this word.");
          return;
        }
        setEntry(response.entry);
        setQuery(response.query);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load definition. Try again or type the word in Define.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, word, sourceLanguage, targetLanguage, userContext]);

  const contextMeaning =
    entry?.profession_meanings.find((item) => item.context === userContext)?.meaning_en ||
    entry?.general_meaning_en ||
    "";

  return (
    <InfoSheet open={open} title={`Define: ${word}`} onClose={onClose}>
      {loading && <LoadingState title="Looking up" label="Fetching meaning…" />}
      {error && <CompactAlert variant="warning">{error}</CompactAlert>}
      {entry && !loading && (
        <div className="space-y-2 text-[var(--foreground)]">
          <p className="text-sm leading-relaxed">{contextMeaning || "No short meaning available."}</p>
          {entry.target_meaning && (
            <p className="text-sm">
              <span className="font-semibold">Translation: </span>
              {entry.target_meaning}
            </p>
          )}
          {entry.pronunciation?.simple && (
            <p className="text-xs text-[var(--muted)]">
              Pronunciation: {entry.pronunciation.simple}
            </p>
          )}
          {entry.examples[0]?.text && (
            <p className="text-xs text-[var(--muted)]">Context: {entry.examples[0].text}</p>
          )}
          <ActionButton
            type="button"
            className="!min-h-11"
            onClick={() => {
              if (!query) return;
              const outcome = saveWordFromDictionaryResult(entry, query);
              setSaveMessage(
                outcome.ok
                  ? "Saved to Library."
                  : outcome.reason === "duplicate"
                    ? "Already in Library."
                    : "Could not save word.",
              );
            }}
          >
            Save to Library
          </ActionButton>
          {saveMessage && (
            <p className="text-xs" role="status">
              {saveMessage}
            </p>
          )}
        </div>
      )}
    </InfoSheet>
  );
}
