"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { CompactCard } from "@/components/ui/CompactCard";
import { ExpandableSection } from "@/components/ui/ExpandableSection";
import { VoiceInputTextArea } from "@/components/speech/VoiceInputTextArea";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { Badge } from "@/components/ui/StatusBadge";
import type { OcrSource } from "@/lib/ocr/ocrSchemas";
import type { UserContext } from "@/lib/schemas";

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
  onTranslate: () => void;
  canTranslate: boolean;
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
  onTranslate,
  canTranslate,
}: OcrResultEditorProps) {
  const displayText = isEditing ? correctedText : correctedText || extractedText;
  const hasText = displayText.trim().length > 0;
  const preview =
    hasText && displayText.length > 80
      ? `${displayText.slice(0, 80).trim()}…`
      : hasText
        ? displayText
        : "No text yet — scan or upload, then extract";

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
            {hasText ? displayText : "No text extracted yet."}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <ActionButton variant="secondary" disabled={isBusy} onClick={onExtract}>
            {isBusy ? "Scanning…" : "Extract"}
          </ActionButton>
          <ActionButton variant="ghost" disabled={isBusy} onClick={onToggleEdit}>
            {isEditing ? "Done" : "Edit"}
          </ActionButton>
          <ActionButton
            variant="primary"
            disabled={isBusy || !canTranslate}
            onClick={onTranslate}
          >
            Translate
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
