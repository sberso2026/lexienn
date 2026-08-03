"use client";

import type { MutableRefObject } from "react";
import { SearchableLanguageSelectField } from "@/components/ui/SearchableLanguageSelectField";
import {
  VoiceInputTextArea,
  type VoiceInputApi,
} from "@/components/speech/VoiceInputTextArea";
import { ActionButton } from "@/components/ui/ActionButton";
import type { SpokenLanguageDetectionResult } from "@/lib/languages/spokenLanguageDetection";
import type { UserContext } from "@/lib/schemas";
import type { ConversationSpeaker } from "@/lib/conversation/conversationTypes";

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
      />

      <ActionButton
        type="button"
        fullWidth
        disabled={isPaused || isBusy || draftText.trim().length === 0}
        onClick={onSpeakTurn}
        className="!min-h-16 text-base"
        aria-label={`Translate ${title} turn`}
      >
        Translate {title} turn
      </ActionButton>
    </section>
  );
}
