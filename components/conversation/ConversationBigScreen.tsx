"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import type { ConversationTurn } from "@/lib/conversation/conversationTypes";

type ConversationBigScreenProps = {
  turn: ConversationTurn | null;
  personALabel: string;
  personBLabel: string;
  voiceUnavailable?: string | null;
  onClose: () => void;
  onReplay: () => void;
  onSlow: () => void;
};

export function ConversationBigScreen({
  turn,
  personALabel,
  personBLabel,
  voiceUnavailable,
  onClose,
  onReplay,
  onSlow,
}: ConversationBigScreenProps) {
  const speakerLabel = turn?.speaker === "a" ? personALabel : personBLabel;
  const listenerLabel = turn?.speaker === "a" ? personBLabel : personALabel;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-[var(--foreground)] text-[var(--background)]"
      role="dialog"
      aria-modal="true"
      aria-label="Big Screen conversation view"
    >
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
          Big Screen · {listenerLabel}
        </p>
        <ActionButton type="button" variant="secondary" onClick={onClose} className="!min-h-12">
          Close
        </ActionButton>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-auto px-5 pb-8 text-center">
        {turn ? (
          <>
            <p className="max-w-3xl break-words text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              {turn.translatedText}
            </p>
            <p className="max-w-2xl break-words text-lg leading-relaxed text-white/75 sm:text-xl">
              <span className="block text-xs font-semibold uppercase tracking-wide text-white/50">
                {speakerLabel}
              </span>
              {turn.sourceText}
            </p>
            {voiceUnavailable && (
              <p className="text-sm text-amber-200" role="status">
                {voiceUnavailable}
              </p>
            )}
          </>
        ) : (
          <p className="text-xl text-white/70">Speak a turn to show it here.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <ActionButton
          type="button"
          variant="secondary"
          onClick={onReplay}
          disabled={!turn}
          className="!min-h-14 !min-w-[8rem]"
        >
          Replay
        </ActionButton>
        <ActionButton
          type="button"
          variant="secondary"
          onClick={onSlow}
          disabled={!turn}
          className="!min-h-14 !min-w-[8rem]"
        >
          Slow
        </ActionButton>
      </div>
    </div>
  );
}
