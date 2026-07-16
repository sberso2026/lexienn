"use client";

import { useRef } from "react";
import { VoiceInputButton } from "@/components/speech/VoiceInputButton";
import { VoiceInputStatus } from "@/components/speech/VoiceInputStatus";
import { IconButton } from "@/components/ui/IconButton";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { fieldInputClassName } from "@/components/ui/FormField";
import type { SpeechInputTarget } from "@/lib/speech/speechInputSchemas";
import type { UserContext } from "@/lib/schemas";

interface VoiceInputTextAreaProps {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  languageHint: string;
  userContext: UserContext;
  inputTarget: SpeechInputTarget;
  rows?: number;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  compact?: boolean;
  showPrivacyNote?: boolean;
  showClear?: boolean;
  onClear?: () => void;
}

function ClearIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export function VoiceInputTextArea({
  id,
  label,
  value,
  onChange,
  languageHint,
  userContext,
  inputTarget,
  rows = 3,
  placeholder,
  hint,
  error,
  required,
  disabled = false,
  compact = false,
  showPrivacyNote = false,
  showClear = false,
  onClear,
}: VoiceInputTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoiceInput({
    languageHint,
    userContext,
    inputTarget,
    onTranscript: onChange,
  });

  const handleSpeak = () => {
    if (voice.state === "speech_ready") {
      voice.applyTranscript();
      return;
    }
    voice.startListening();
  };

  const handleClear = () => {
    voice.reset();
    onClear?.();
    textareaRef.current?.focus();
  };

  const clearVisible = showClear && Boolean(onClear);
  const inputClass = `${fieldInputClassName(Boolean(error))} resize-y ${
    compact ? `${clearVisible ? "pr-24" : "pr-14"} text-base` : clearVisible ? "pr-14" : ""
  }`;

  return (
    <div className="space-y-2">
      {!compact && label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--foreground)]">
          {label}
          {required && <span className="text-red-600"> *</span>}
        </label>
      )}
      {compact && label && (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          id={id}
          name={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          disabled={disabled}
        />
        <div
          className={`absolute flex items-center gap-0.5 ${compact ? "right-1.5 top-1.5" : "right-2 top-2"}`}
        >
          {clearVisible && (
            <IconButton
              icon={<ClearIcon />}
              label="Clear previous entry"
              size="sm"
              variant="ghost"
              className="!min-h-11 !w-11"
              onClick={handleClear}
            />
          )}
          <VoiceInputButton
            state={voice.state}
            isRecording={voice.isRecording}
            disabled={disabled}
            onSpeak={handleSpeak}
            onStop={voice.stopListening}
            className="!min-h-11 !px-3"
          />
        </div>
      </div>

      {hint && !compact && (
        <p id={`${id}-hint`} className="text-xs text-[var(--muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {voice.state !== "idle" && (
        <VoiceInputStatus
          state={voice.state}
          pendingTranscript={voice.pendingTranscript}
          interimTranscript={voice.interimTranscript}
          capturedSpeechPreview={voice.capturedSpeechPreview}
          recordingTimerLabel={voice.recordingTimerLabel}
          statusMessage={voice.statusMessage}
          onApplyTranscript={voice.applyTranscript}
          onTryAgain={voice.startListening}
          onDismiss={voice.dismiss}
          onStop={voice.stopListening}
          showPrivacyNote={showPrivacyNote}
        />
      )}
    </div>
  );
}
