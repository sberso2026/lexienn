"use client";

import { VoiceInputButton } from "@/components/speech/VoiceInputButton";
import { VoiceInputStatus } from "@/components/speech/VoiceInputStatus";
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
}: VoiceInputTextAreaProps) {
  const voice = useVoiceInput({
    languageHint,
    userContext,
    inputTarget,
    onTranscript: onChange,
  });

  const handleSpeak = () => {
    if (voice.state === "ready") {
      voice.applyTranscript();
      return;
    }
    void voice.startListening();
  };

  const inputClass = `${fieldInputClassName(Boolean(error))} resize-y ${compact ? "pr-12 text-base" : ""}`;

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
        <div className={`absolute ${compact ? "right-1.5 top-1.5" : "right-2 top-2"}`}>
          <VoiceInputButton
            state={voice.state}
            disabled={disabled}
            onSpeak={handleSpeak}
            className="!min-h-9 !px-2"
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
          statusMessage={voice.statusMessage}
          onApplyTranscript={voice.applyTranscript}
          onTryAgain={() => void voice.startListening()}
          onDismiss={voice.dismiss}
          showPrivacyNote={showPrivacyNote}
        />
      )}
    </div>
  );
}
