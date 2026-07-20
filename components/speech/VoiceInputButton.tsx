"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import type { VoiceInputState } from "@/lib/speech/speechInputSchemas";

interface VoiceInputButtonProps {
  state: VoiceInputState;
  isRecording?: boolean;
  disabled?: boolean;
  onSpeak: () => void;
  onStop?: () => void;
  className?: string;
}

const STATE_LABELS: Record<VoiceInputState, string> = {
  idle: "Speak",
  requesting_permission: "Listening…",
  listening: "Listening…",
  processing_speech: "Processing voice…",
  speech_ready: "Use transcript",
  speech_error: "Try again",
  permission_denied: "Try again",
  unsupported: "Type manually",
};

export function VoiceInputButton({
  state,
  isRecording = false,
  disabled = false,
  onSpeak,
  onStop,
  className = "",
}: VoiceInputButtonProps) {
  const isBusy =
    isRecording ||
    state === "requesting_permission" ||
    state === "listening" ||
    state === "processing_speech";
  const label = STATE_LABELS[state];

  if (isBusy && onStop) {
    return (
      <ActionButton
        type="button"
        variant="secondary"
        disabled={disabled}
        aria-busy
        aria-label="Stop voice input"
        onClick={onStop}
        className={`!min-h-14 !min-w-14 shrink-0 px-3 sm:px-4 ${className}`}
      >
        <span className="inline-flex items-center gap-1.5">
          <StopIcon />
          <span className="hidden sm:inline">Stop</span>
        </span>
      </ActionButton>
    );
  }

  return (
    <ActionButton
      type="button"
      variant="secondary"
      disabled={disabled || isBusy}
      aria-busy={isBusy}
      aria-label={label}
      onClick={onSpeak}
      className={`!min-h-14 !min-w-14 shrink-0 px-3 sm:px-4 ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <MicrophoneIcon active={isBusy} />
        <span className="hidden sm:inline">{label}</span>
      </span>
    </ActionButton>
  );
}

function MicrophoneIcon({ active }: { active: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`h-5 w-5 ${active ? "animate-pulse text-[var(--accent)]" : ""}`}
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.08A7 7 0 0 0 17 11Z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 text-red-600"
      aria-hidden
    >
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    </svg>
  );
}
