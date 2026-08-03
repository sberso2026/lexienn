"use client";

import type { MutableRefObject } from "react";
import { SearchableLanguageSelectField } from "@/components/ui/SearchableLanguageSelectField";
import {
  VoiceInputTextArea,
  type VoiceInputApi,
} from "@/components/speech/VoiceInputTextArea";
import { ActionButton } from "@/components/ui/ActionButton";
import { CompactAlert } from "@/components/ui/CompactAlert";
import type { SpokenLanguageDetectionResult } from "@/lib/languages/spokenLanguageDetection";
import type { UserContext } from "@/lib/schemas";
import type { ConversationSpeaker } from "@/lib/conversation/conversationTypes";
import type { VoiceTranscriptMeta } from "@/hooks/useVoiceInput";
import { BISAYA_CONFIRM_MESSAGE } from "@/lib/speech/bisayaStt";

type ConversationSpeakerPanelProps = {
  speaker: ConversationSpeaker;
  title: string;
  languageValue: string;
  onLanguageChange: (value: string) => void;
  leadingOptions?: Array<{ value: string; label: string }>;
  draftText: string;
  onDraftChange: (value: string) => void;
  isActive: boolean;
  isPaused: boolean;
  isBusy: boolean;
  userContext: UserContext;
  onLanguageDetection: (detection: SpokenLanguageDetectionResult) => void;
  onSpeakTurn: () => void;
  onMicSessionStart: () => void;
  voiceApiRef: MutableRefObject<VoiceInputApi | null>;
  needsTranscriptConfirm: boolean;
  onTranscriptMeta: (meta: VoiceTranscriptMeta) => void;
  onConfirmTranscript: () => void;
  onTryAgainTranscript: () => void;
  onTypeManually: () => void;
  onTeachBisayaPhrase: () => void;
  getSttHints: () => string[];
  teachStatus?: string | null;
};

export function ConversationSpeakerPanel({
  speaker,
  title,
  languageValue,
  onLanguageChange,
  leadingOptions,
  draftText,
  onDraftChange,
  isActive,
  isPaused,
  isBusy,
  userContext,
  onLanguageDetection,
  onSpeakTurn,
  onMicSessionStart,
  voiceApiRef,
  needsTranscriptConfirm,
  onTranscriptMeta,
  onConfirmTranscript,
  onTryAgainTranscript,
  onTypeManually,
  onTeachBisayaPhrase,
  getSttHints,
  teachStatus,
}: ConversationSpeakerPanelProps) {
  return (
    <section
      className={`space-y-3 rounded-2xl border p-4 ${
        isActive
          ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-[0_0_0_1px_var(--accent)]"
          : "border-[var(--card-border)] bg-[var(--card)]"
      }`}
      aria-label={`${title} panel`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {title}
          </p>
          {isActive && (
            <p className="mt-0.5 text-xs font-semibold text-[var(--accent)]" role="status">
              Active speaker
            </p>
          )}
        </div>
      </div>

      <SearchableLanguageSelectField
        id={`conversation_lang_${speaker}`}
        label="Language"
        value={languageValue}
        onChange={onLanguageChange}
        leadingOptions={leadingOptions}
      />

      <VoiceInputTextArea
        id={`conversation_draft_${speaker}`}
        label={`${title} text`}
        value={draftText}
        onChange={onDraftChange}
        rows={3}
        placeholder={isPaused ? "Paused…" : "Tap Speak or type…"}
        languageHint={languageValue}
        userContext={userContext}
        inputTarget="translator"
        compact
        showPrivacyNote={isActive}
        disabled={isPaused}
        sessionOwnerId={`conversation:${speaker}`}
        onSessionStart={onMicSessionStart}
        voiceApiRef={voiceApiRef}
        onLanguageDetection={onLanguageDetection}
        onTranscriptMeta={onTranscriptMeta}
        getSttHints={getSttHints}
      />

      {needsTranscriptConfirm && (
        <CompactAlert variant="warning">
          <p className="font-medium">{BISAYA_CONFIRM_MESSAGE}</p>
          <p className="mt-1 text-xs">
            Edit the transcript below if needed, then confirm before translating.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton type="button" onClick={onConfirmTranscript} className="!min-h-11">
              Confirm
            </ActionButton>
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onTryAgainTranscript}
              className="!min-h-11"
            >
              Try Again
            </ActionButton>
            <ActionButton
              type="button"
              variant="ghost"
              onClick={onTypeManually}
              className="!min-h-11"
            >
              Type Manually
            </ActionButton>
            <ActionButton
              type="button"
              variant="secondary"
              onClick={onTeachBisayaPhrase}
              disabled={draftText.trim().length === 0}
              className="!min-h-11"
            >
              Teach Lexienn this Bisaya phrase
            </ActionButton>
          </div>
          {teachStatus && (
            <p className="mt-2 text-xs" role="status">
              {teachStatus}
            </p>
          )}
        </CompactAlert>
      )}

      <ActionButton
        type="button"
        fullWidth
        disabled={
          isPaused || isBusy || draftText.trim().length === 0 || needsTranscriptConfirm
        }
        onClick={onSpeakTurn}
        className="!min-h-16 text-base"
        aria-label={`Translate ${title} turn`}
      >
        Translate {title} turn
      </ActionButton>
    </section>
  );
}
