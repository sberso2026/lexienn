"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { VoiceInputTextArea } from "@/components/speech/VoiceInputTextArea";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Badge } from "@/components/ui/StatusBadge";
import type { OcrSource } from "@/lib/ocr/ocrSchemas";
import type { UserContext } from "@/lib/schemas";
import {
  isTappableOcrToken,
  normalizeTappedWord,
  tokenizeOcrWords,
} from "@/lib/lens/ocrBlocks";

interface OcrResultEditorProps {
  extractedText: string;
  correctedText: string;
  confidenceScore: number;
  ocrSource: OcrSource | null;
  ocrModeLabel: string;
  isEditing: boolean;
  isBusy?: boolean;
  languageHint?: string;
  userContext?: UserContext;
  showDeveloperDetails?: boolean;
  onCorrectedTextChange: (value: string) => void;
  onToggleEdit: () => void;
  onExtract: () => void;
  onTapWord?: (word: string) => void;
}

const SOURCE_LABELS: Record<OcrSource, string> = {
  local_ocr: "On-device scan",
  cloud_ocr: "Cloud scan",
  unavailable: "Manual entry",
};

export function OcrResultEditor({
  extractedText,
  correctedText,
  confidenceScore,
  ocrSource,
  ocrModeLabel,
  isEditing,
  isBusy = false,
  languageHint = "en",
  userContext = "general",
  showDeveloperDetails = false,
  onCorrectedTextChange,
  onToggleEdit,
  onExtract,
  onTapWord,
}: OcrResultEditorProps) {
  const displayText = isEditing ? correctedText : correctedText || extractedText;
  const hasText = displayText.trim().length > 0;
  const preview =
    hasText && displayText.length > 80
      ? `${displayText.slice(0, 80).trim()}…`
      : hasText
        ? displayText
        : "No text yet — scan or upload, then extract";
  const tokens = tokenizeOcrWords(displayText);

  return (
    <CompactCard padding="sm">
      <ExpandableSection
        summary={`Review text · ${preview}`}
        defaultOpen={isEditing || hasText}
      >
        {isEditing ? (
          <VoiceInputTextArea
            id="ocr_corrected_text"
            label="Extracted text"
            value={correctedText}
            onChange={onCorrectedTextChange}
            rows={4}
            placeholder="Edit extracted text…"
            languageHint={languageHint}
            userContext={userContext}
            inputTarget="translator"
            disabled={isBusy}
            compact
          />
        ) : (
          <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2.5 text-sm leading-relaxed">
            {hasText ? (
              <p className="whitespace-pre-wrap">
                {tokens.map((token, index) => {
                  if (!onTapWord || !isTappableOcrToken(token)) {
                    return <span key={`${token}-${index}`}>{token}</span>;
                  }
                  const word = normalizeTappedWord(token);
                  return (
                    <button
                      key={`${word}-${index}`}
                      type="button"
                      className="rounded px-0.5 font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                      onClick={() => onTapWord(word)}
                    >
                      {token}
                    </button>
                  );
                })}
              </p>
            ) : (
              "No text extracted yet."
            )}
            {hasText && onTapWord && (
              <p className="mt-2 text-[11px] text-[var(--muted)]">
                Tap a word to open Tap to Define.
              </p>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton variant="secondary" disabled={isBusy} onClick={onExtract}>
            {isBusy ? "Scanning…" : "Extract"}
          </ActionButton>
          <ActionButton variant="ghost" disabled={isBusy} onClick={onToggleEdit}>
            {isEditing ? "Done" : "Edit"}
          </ActionButton>
        </div>
      </ExpandableSection>

      {showDeveloperDetails && ocrSource && (
        <ExpandableSection summary="Developer details" className="mt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge label={ocrModeLabel} variant="info" />
            <Badge label={SOURCE_LABELS[ocrSource]} variant="neutral" />
            {ocrSource !== "unavailable" && (
              <ConfidenceBadge score={confidenceScore} />
            )}
          </div>
        </ExpandableSection>
      )}
    </CompactCard>
  );
}
