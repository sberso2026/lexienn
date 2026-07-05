"use client";

import { useState } from "react";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WarningCallout } from "@/components/ui/WarningCallout";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { resolveOfflineTranslation } from "@/lib/offline/offlineTranslationResolver";
import type { OfflinePhrasePack, OfflineTranslationResult } from "@/lib/schemas";
import { formatEnumLabel } from "@/lib/dictionary/displayUtils";

const SAMPLE_SENTENCES = [
  "I need water.",
  "Where is the nearest clinic?",
  "How much is food?",
  "Can you help me with transport?",
];

interface OfflineSentenceTranslatorProps {
  pack: OfflinePhrasePack;
  languageCode: string;
}

export function OfflineSentenceTranslator({
  pack,
  languageCode,
}: OfflineSentenceTranslatorProps) {
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [result, setResult] = useState<OfflineTranslationResult | null>(null);

  function handleResolve(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      setInputError("Enter an English sentence to translate offline.");
      setResult(null);
      return;
    }

    setInputError(null);
    const resolved = resolveOfflineTranslation(trimmed, pack, languageCode);
    setResult(resolved);
  }

  const showLowConfidence =
    result &&
    (result.resolution_method === "unavailable" || result.confidence_score < 0.6);

  return (
    <FeatureCard title="Offline sentence translation">
      <p id="offline-translator-help" className="text-sm text-[var(--muted)]">
        Limited offline matching from your downloaded pack only. No AI — phrase,
        template, and keyword rules.
      </p>

      <form onSubmit={handleResolve} className="mt-4 space-y-4" noValidate>
        <div>
          <label htmlFor="offline-sentence" className="block text-sm font-medium">
            English sentence
          </label>
          <textarea
            id="offline-sentence"
            rows={3}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setInputError(null);
            }}
            placeholder="e.g. Where is the nearest clinic?"
            aria-invalid={Boolean(inputError)}
            aria-describedby={
              inputError
                ? "offline-sentence-error"
                : "offline-translator-help"
            }
            className={`mt-1 w-full min-h-11 rounded-lg border bg-[var(--card)] px-3 py-2 text-base ${
              inputError ? "border-red-500" : "border-[var(--card-border)]"
            }`}
          />
          {inputError && (
            <p
              id="offline-sentence-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {inputError}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          Translate offline
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SAMPLE_SENTENCES.map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => {
              setInput(sample);
              setInputError(null);
            }}
            aria-label={`Use sample sentence: ${sample}`}
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--background)] px-3 py-2 text-sm hover:bg-[var(--card)]"
          >
            {sample}
          </button>
        ))}
      </div>

      {result && (
        <div className="mt-6 space-y-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={formatEnumLabel(result.resolution_method)}
              variant={
                result.resolution_method === "unavailable" ? "coming-soon" : "offline"
              }
            />
            <ConfidenceBadge score={result.confidence_score} />
          </div>

          {showLowConfidence && (
            <WarningCallout title="Limited offline match">
              {result.resolution_method === "unavailable"
                ? "This sentence is not available in the downloaded offline pack. Try a simpler phrase."
                : "Low confidence offline match — verify with a local speaker when possible."}
            </WarningCallout>
          )}

          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              Original
            </p>
            <p className="text-sm">{result.original_sentence}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              Resolved translation
            </p>
            <p className="text-lg font-semibold">{result.resolved_translation}</p>
            {result.pronunciation_simple && (
              <p className="mt-1 text-sm text-[var(--muted)]">
                {result.pronunciation_simple}
              </p>
            )}
          </div>

          {result.warning && (
            <WarningCallout>{result.warning}</WarningCallout>
          )}

          {result.debug_note && (
            <p className="text-xs text-[var(--muted)]">
              Debug: {result.debug_note}
            </p>
          )}

          <VoiceButton
            text={result.resolved_translation}
            language={languageCode}
            pronunciationSimple={result.pronunciation_simple}
            offlineMode
            disabled={result.resolution_method === "unavailable"}
            label="Play voice"
            aria-label="Play resolved translation"
            variant="secondary"
          />
        </div>
      )}
    </FeatureCard>
  );
}
