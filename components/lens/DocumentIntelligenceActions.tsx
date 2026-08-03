"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import { CompactCard } from "@/components/ui/CompactCard";
import {
  LENS_DOCUMENT_ACTIONS,
  LENS_SAFETY_DISCLAIMER,
  type LensDocumentActionId,
} from "@/lib/lens/lensTypes";
import type { DocumentIntelligenceResult } from "@/lib/lens/documentIntelligence";

type DocumentIntelligenceActionsProps = {
  disabled?: boolean;
  result: DocumentIntelligenceResult | null;
  onAction: (action: LensDocumentActionId) => void;
  onDefineWord?: (word: string) => void;
};

export function DocumentIntelligenceActions({
  disabled = false,
  result,
  onAction,
  onDefineWord,
}: DocumentIntelligenceActionsProps) {
  return (
    <CompactCard padding="sm">
      <p className="text-sm font-semibold">Document intelligence</p>
      <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">
        Language-focused tools for signs, labels, menus, tickets, and notices.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {LENS_DOCUMENT_ACTIONS.map((action) => (
          <ActionButton
            key={action.id}
            type="button"
            variant="secondary"
            className="!min-h-11"
            disabled={disabled}
            onClick={() => onAction(action.id)}
          >
            {action.label}
          </ActionButton>
        ))}
      </div>

      {result && (
        <div className="mt-3 space-y-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">{result.title}</p>
            <span className="rounded-full bg-[var(--muted)]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
              {result.isAiExplanation ? "AI explanation" : "OCR-derived"}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--foreground)]">
            {result.body}
          </p>
          {result.items && result.items.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {result.items.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    className="rounded-full border border-[var(--card-border)] px-2.5 py-1 text-xs font-medium text-[var(--accent)]"
                    onClick={() => onDefineWord?.(item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {result.isAiExplanation && (
            <CompactAlert variant="warning">{LENS_SAFETY_DISCLAIMER}</CompactAlert>
          )}
        </div>
      )}
    </CompactCard>
  );
}
